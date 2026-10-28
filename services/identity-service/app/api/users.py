"""
Users router — admin CRUD for user accounts and role management.

All endpoints require ADMIN or SUPER_ADMIN role unless noted.

Endpoints:
  POST   /api/v1/users/                     — provision a new user
  GET    /api/v1/users/                     — list all users (paginated)
  GET    /api/v1/users/{user_id}            — get a single user
  PATCH  /api/v1/users/{user_id}            — update status / email
  POST   /api/v1/users/{user_id}/roles      — assign a role
  DELETE /api/v1/users/{user_id}/roles/{role_name} — revoke a role
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DBSession, require_roles
from app.schemas.user import RoleRead, UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

# Guard: only ADMIN and SUPER_ADMIN may manage users
_admin_guard = Depends(require_roles("ADMIN", "SUPER_ADMIN"))


def _svc(db: DBSession) -> UserService:
    return UserService(db)


# ── Provision a new user ──────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Provision a new user account",
    dependencies=[_admin_guard],
)
async def create_user(
    payload: UserCreate,
    db: DBSession,
):
    """
    Create a new provisioned user account (admin operation).
    The user will be able to log in via Google OAuth after provisioning.
    """
    svc = UserService(db)
    try:
        user = await svc.create_user(payload)
        await db.commit()
        await db.refresh(user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return UserRead(
        id=user.id,
        email=user.email,
        status=user.status,
        email_verified_at=user.email_verified_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[],
    )


# ── List users ────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[UserRead],
    summary="List all provisioned users",
    dependencies=[_admin_guard],
)
async def list_users(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    svc = UserService(db)
    users = await svc.list_users(skip=skip, limit=limit)
    return [
        UserRead(
            id=u.id,
            email=u.email,
            status=u.status,
            email_verified_at=u.email_verified_at,
            created_at=u.created_at,
            updated_at=u.updated_at,
            roles=[
                RoleRead(id=ur.role.id, name=ur.role.name) for ur in u.user_roles
            ],
        )
        for u in users
    ]


# ── Get a single user ─────────────────────────────────────────────────────────

@router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Get a single user by ID",
    dependencies=[_admin_guard],
)
async def get_user(user_id: uuid.UUID, db: DBSession):
    svc = UserService(db)
    try:
        user = await svc.get_user(user_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return UserRead(
        id=user.id,
        email=user.email,
        status=user.status,
        email_verified_at=user.email_verified_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[
            RoleRead(id=ur.role.id, name=ur.role.name) for ur in user.user_roles
        ],
    )


# ── Update a user ─────────────────────────────────────────────────────────────

@router.patch(
    "/{user_id}",
    response_model=UserRead,
    summary="Update user status or email",
    dependencies=[_admin_guard],
)
async def update_user(user_id: uuid.UUID, payload: UserUpdate, db: DBSession):
    svc = UserService(db)
    try:
        user = await svc.update_user(user_id, payload)
        await db.commit()
        await db.refresh(user)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return UserRead(
        id=user.id,
        email=user.email,
        status=user.status,
        email_verified_at=user.email_verified_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[
            RoleRead(id=ur.role.id, name=ur.role.name) for ur in user.user_roles
        ],
    )


# ── Assign a role ─────────────────────────────────────────────────────────────

class RoleAssignBody(BaseModel):
    role_name: str


@router.post(
    "/{user_id}/roles",
    response_model=RoleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Assign a role to a user",
    dependencies=[Depends(require_roles("SUPER_ADMIN"))],
)
async def assign_role(
    user_id: uuid.UUID,
    payload: RoleAssignBody,
    db: DBSession,
):
    """Only SUPER_ADMIN may assign roles."""
    svc = UserService(db)
    try:
        user_role = await svc.assign_role(
            user_id=user_id,
            role_name=payload.role_name,
        )
        await db.commit()
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return RoleRead(id=user_role.role_id, name=payload.role_name.upper())


# ── Revoke a role ─────────────────────────────────────────────────────────────

@router.delete(
    "/{user_id}/roles/{role_name}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a role from a user",
    dependencies=[Depends(require_roles("SUPER_ADMIN"))],
)
async def revoke_role(user_id: uuid.UUID, role_name: str, db: DBSession):
    """Only SUPER_ADMIN may revoke roles."""
    svc = UserService(db)
    try:
        await svc.revoke_role(user_id=user_id, role_name=role_name)
        await db.commit()
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
