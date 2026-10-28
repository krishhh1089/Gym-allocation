"""
Shared FastAPI dependencies for the Identity Service.

  • get_db          — yields an AsyncSession (already in database.py, re-exported)
  • get_current_user — extracts and validates the JWT from the Authorization header
  • require_roles   — factory that returns a dependency enforcing a minimum role set
"""

from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import CurrentUser
from app.services.auth_service import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

# ── Type aliases ──────────────────────────────────────────────────────────────

DBSession = Annotated[AsyncSession, Depends(get_db)]


# ── Current user dependency ───────────────────────────────────────────────────

async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Security(bearer_scheme)
    ] = None,
) -> CurrentUser:
    """
    Extract and validate the JWT from the `Authorization: Bearer <token>` header.
    Returns a CurrentUser pydantic model — no DB round-trip needed for most routes.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(
        user_id=payload["sub"],
        email=payload["email"],
        roles=payload.get("roles", []),
        status=payload.get("status", ""),
    )


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


# ── Role guard ────────────────────────────────────────────────────────────────

def require_roles(*roles: str):
    """
    Dependency factory.  Usage:

        @router.get("/admin-only")
        async def admin_endpoint(
            _: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN"))
        ):
            ...
    """
    allowed = set(roles)

    async def _guard(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if not allowed.intersection(current_user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(sorted(allowed))}",
            )
        return current_user

    return _guard
