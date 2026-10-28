"""
Roles router — read-only access to available application roles.

Endpoints:
  GET /api/v1/roles/  — list all roles (any authenticated user)
"""

from fastapi import APIRouter

from app.api.deps import CurrentUserDep, DBSession
from app.schemas.user import RoleRead
from app.services.user_service import UserService

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get(
    "/",
    response_model=list[RoleRead],
    summary="List all application roles",
)
async def list_roles(
    _: CurrentUserDep,  # require authentication
    db: DBSession,
):
    """Returns all seeded application roles (STUDENT, TRAINER, ADMIN, SUPER_ADMIN)."""
    svc = UserService(db)
    roles = await svc.list_roles()
    return [RoleRead(id=r.id, name=r.name) for r in roles]
