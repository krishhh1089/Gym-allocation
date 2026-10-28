"""
AuthService — Google OAuth 2.0 + JWT lifecycle.

Responsibilities:
  • Exchange Google authorisation code for tokens.
  • Verify the Google ID token and extract the user's identity claims.
  • Enforce the allowed-email-domain policy.
  • Issue, verify, and revoke application JWTs.
  • Persist and expire server-side AuthSession records.
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import AuthSession, ExternalIdentity, User
from app.repositories.user_repository import UserRepository


# ── Google OAuth helpers ──────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_SCOPES = "openid email profile"


def build_google_redirect_url(state: str) -> str:
    """Return the Google OAuth2 authorisation endpoint URL."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_callback_url,
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_code_for_tokens(code: str) -> dict:
    """POST the auth code to Google and return the raw token response."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_callback_url,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        return response.json()


async def fetch_google_userinfo(access_token: str) -> dict:
    """Fetch user profile from Google userinfo endpoint."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()


def validate_email_domain(email: str) -> None:
    """Raise ValueError if email domain is not in the allowed list."""
    domain = email.split("@")[-1].lower()
    if domain not in settings.allowed_domains_list:
        raise ValueError(
            f"Email domain '{domain}' is not permitted. "
            f"Allowed domains: {', '.join(settings.allowed_domains_list)}"
        )


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    *,
    user_id: uuid.UUID,
    email: str,
    roles: list[str],
    status: str,
) -> tuple[str, datetime]:
    """
    Create a signed JWT and return (token, expiry_datetime).
    The JWT carries only non-sensitive identity claims.
    """
    expire = _utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "email": email,
        "roles": roles,
        "status": status,
        "iat": _utcnow(),
        "exp": expire,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expire


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT.  Raises JWTError on any failure.
    Returns the raw payload dict.
    """
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


# ── Session helpers ───────────────────────────────────────────────────────────

def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def generate_session_token() -> str:
    """Generate a cryptographically random opaque session token."""
    return secrets.token_urlsafe(48)


# ── AuthService ───────────────────────────────────────────────────────────────

class AuthService:
    """
    Orchestrates the full Google OAuth ↔ local user lifecycle.
    Injected with a unit-of-work session; callers commit the transaction.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._user_repo = UserRepository(session)

    async def handle_google_callback(
        self, code: str
    ) -> tuple[User, str, datetime]:
        """
        Full OAuth callback flow:
          1. Exchange code → Google tokens.
          2. Fetch userinfo and validate email domain.
          3. Find or create local User + ExternalIdentity.
          4. Issue a server-side AuthSession.
          5. Return (user, access_token, expires_at).
        """
        token_data = await exchange_code_for_tokens(code)
        userinfo = await fetch_google_userinfo(token_data["access_token"])

        email: str = userinfo.get("email", "").lower().strip()
        if not userinfo.get("email_verified"):
            raise ValueError("Google account email is not verified.")
        validate_email_domain(email)

        provider_subject: str = userinfo["sub"]  # stable Google user ID

        # ── Find or create user ────────────────────────────────────────────
        user = await self._user_repo.get_by_provider("google", provider_subject)
        if user is None:
            # Fall back to email lookup (account was provisioned before first login)
            user = await self._user_repo.get_by_email(email)
            if user is None:
                raise PermissionError(
                    "No provisioned account found for this email address. "
                    "Please contact an administrator."
                )
            # Link the Google identity to the existing provisioned user
            ext = ExternalIdentity(
                user_id=user.id,
                provider="google",
                provider_subject=provider_subject,
            )
            self._session.add(ext)
            # Mark email as verified
            if user.email_verified_at is None:
                user.email_verified_at = _utcnow()
                self._session.add(user)

        if user.status not in {"ACTIVE", "PENDING"}:
            raise PermissionError(
                f"Your account is {user.status}. Please contact an administrator."
            )

        # ── Issue JWT ──────────────────────────────────────────────────────
        roles = [ur.role.name for ur in user.user_roles]
        access_token, expires_at = create_access_token(
            user_id=user.id,
            email=user.email,
            roles=roles,
            status=user.status,
        )

        # ── Persist server-side session ────────────────────────────────────
        session_raw = generate_session_token()
        auth_session = AuthSession(
            user_id=user.id,
            session_token_hash=_hash_token(session_raw),
            expires_at=expires_at,
            created_at=_utcnow(),
        )
        self._session.add(auth_session)
        await self._session.flush()

        return user, access_token, expires_at

    async def revoke_sessions(self, user_id: uuid.UUID) -> None:
        """Soft-revoke all active sessions for the given user."""
        from sqlalchemy import select, update
        from app.models.user import AuthSession as AS

        now = _utcnow()
        await self._session.execute(
            update(AS)
            .where(AS.user_id == user_id, AS.revoked_at.is_(None))
            .values(revoked_at=now)
        )
