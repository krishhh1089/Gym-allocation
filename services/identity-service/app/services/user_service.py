"""
UserService — business logic for user and role management.

Responsibilities:
  • Provision (create) user accounts.
  • Update user status and email (admin operations).
  • List users with pagination.
  • Assign and revoke roles.
  • Seed default roles on startup.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role, UserRole
from app.models.user import User
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.user import UserCreate, UserUpdate

DEFAULT_ROLES = ["STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._user_repo = UserRepository(session)
        self._role_repo = RoleRepository(session)

    # ── Role seeding ──────────────────────────────────────────────────────────

    async def seed_roles(self) -> None:
        """
        Idempotently insert the default application roles.
        Called once at application startup.
        """
        for name in DEFAULT_ROLES:
            existing = await self._role_repo.get_by_name(name)
            if existing is None:
                self._session.add(Role(name=name))
        await self._session.flush()

    # ── User CRUD ─────────────────────────────────────────────────────────────

    async def create_user(self, payload: UserCreate) -> User:
        """
        Provision a new user account.
        Email is normalised to lowercase; duplicates raise ValueError.
        """
        email = payload.email.lower().strip()
        existing = await self._user_repo.get_by_email(email)
        if existing is not None:
            raise ValueError(f"A user with email '{email}' already exists.")

        user = User(email=email, status=payload.status)
        return await self._user_repo.create(user)

    async def get_user(self, user_id: uuid.UUID) -> User:
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise LookupError(f"User '{user_id}' not found.")
        return user

    async def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        return await self._user_repo.list_all(skip=skip, limit=limit)

    async def update_user(self, user_id: uuid.UUID, payload: UserUpdate) -> User:
        user = await self.get_user(user_id)

        if payload.email is not None:
            new_email = payload.email.lower().strip()
            if new_email != user.email:
                conflict = await self._user_repo.get_by_email(new_email)
                if conflict is not None:
                    raise ValueError(f"Email '{new_email}' is already taken.")
            user.email = new_email

        if payload.status is not None:
            user.status = payload.status

        return await self._user_repo.save(user)

    # ── Role management ───────────────────────────────────────────────────────

    async def assign_role(
        self,
        user_id: uuid.UUID,
        role_name: str,
        assigned_by: uuid.UUID | None = None,
    ) -> UserRole:
        """
        Assign a role to a user.  Idempotent — re-assigning an existing role
        is a no-op (returns the existing UserRole).
        """
        user = await self.get_user(user_id)
        role = await self._role_repo.get_by_name(role_name)
        if role is None:
            raise LookupError(f"Role '{role_name}' not found.")

        # Check idempotency
        existing = await self._role_repo.get_user_role(user_id, role.id)
        if existing is not None:
            return existing

        user_role = UserRole(
            user_id=user_id,
            role_id=role.id,
            assigned_by=assigned_by,
            assigned_at=_utcnow(),
        )
        return await self._role_repo.assign_role(user_role)

    async def revoke_role(self, user_id: uuid.UUID, role_name: str) -> None:
        """Remove a role from a user.  Silently succeeds if not assigned."""
        from sqlalchemy import delete
        from app.models.role import UserRole as UR

        role = await self._role_repo.get_by_name(role_name)
        if role is None:
            raise LookupError(f"Role '{role_name}' not found.")

        await self._session.execute(
            delete(UR).where(
                UR.user_id == user_id,
                UR.role_id == role.id,
            )
        )

    async def list_roles(self) -> list[Role]:
        return await self._role_repo.list_all()
