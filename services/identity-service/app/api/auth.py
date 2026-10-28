"""
Auth router — Google OAuth 2.0 login flow + session management.

Endpoints:
  GET  /api/v1/auth/google/redirect   — build & return the Google auth URL
  GET  /api/v1/auth/google/callback   — exchange code, issue JWT
  GET  /api/v1/auth/me                — return current authenticated user info
  POST /api/v1/auth/logout            — revoke server-side sessions
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUserDep, DBSession, get_current_user
from app.database import get_db
from app.schemas.user import CurrentUser, TokenResponse, UserRead
from app.services.auth_service import AuthService, build_google_redirect_url
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── 1. Initiate Google OAuth flow ─────────────────────────────────────────────

@router.get(
    "/google/redirect",
    summary="Begin Google OAuth login",
    response_description="Redirect URL to Google's consent screen",
)
async def google_redirect(request: Request):
    """
    Generates a Google OAuth2 authorisation URL.

    In browser-based flows the frontend should **redirect** the user to the
    returned `redirect_url`.  A random `state` token is stored in a signed
    cookie for CSRF protection.
    """
    state = secrets.token_urlsafe(32)
    redirect_url = build_google_redirect_url(state)
    response = JSONResponse({"redirect_url": redirect_url, "state": state})
    # Set state in HttpOnly cookie so the callback can verify it
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        max_age=300,  # 5 minutes
        secure=False,  # set to True in production (HTTPS)
    )
    return response


# ── 2. Google OAuth callback ──────────────────────────────────────────────────

@router.get(
    "/google/callback",
    summary="Handle Google OAuth callback",
    response_model=TokenResponse,
)
async def google_callback(
    code: str,
    state: str,
    request: Request,
    db: DBSession,
):
    """
    Receives the authorisation code from Google.

    Steps performed server-side:
    1. Validate CSRF state cookie.
    2. Exchange code for Google tokens.
    3. Fetch userinfo and verify email domain.
    4. Find or create the local user record.
    5. Issue a signed JWT access token.
    6. Persist a server-side AuthSession.
    """
    # CSRF check
    cookie_state = request.cookies.get("oauth_state")
    if not cookie_state or cookie_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state parameter. Possible CSRF attempt.",
        )

    auth_svc = AuthService(db)
    try:
        user, access_token, expires_at = await auth_svc.handle_google_callback(code)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OAuth provider error: {exc}",
        )

    await db.commit()

    from app.config import settings

    response = JSONResponse(
        {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }
    )
    # Clear the CSRF cookie
    response.delete_cookie("oauth_state")
    return response


# ── 3. Current user info ──────────────────────────────────────────────────────

@router.get(
    "/me",
    summary="Get current authenticated user",
    response_model=UserRead,
)
async def get_me(
    current_user: CurrentUserDep,
    db: DBSession,
):
    """
    Returns the full user record for the authenticated caller.
    Requires a valid JWT in the Authorization header.
    """
    from app.repositories.user_repository import UserRepository
    import uuid

    repo = UserRepository(db)
    user = await repo.get_by_id(uuid.UUID(str(current_user.user_id)))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return UserRead(
        id=user.id,
        email=user.email,
        status=user.status,
        email_verified_at=user.email_verified_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[
            {"id": ur.role.id, "name": ur.role.name}
            for ur in user.user_roles
        ],
    )


# ── 4. Logout ─────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    summary="Revoke all active sessions for the current user",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(
    current_user: CurrentUserDep,
    db: DBSession,
):
    """
    Revokes all server-side AuthSession records for the caller.
    The JWT itself will remain structurally valid until its `exp` claim,
    but all server-tracked sessions are marked as revoked.
    """
    import uuid

    auth_svc = AuthService(db)
    await auth_svc.revoke_sessions(uuid.UUID(str(current_user.user_id)))
    await db.commit()
