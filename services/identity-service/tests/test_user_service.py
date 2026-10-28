import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserCreate, UserUpdate
from app.services.user_service import DEFAULT_ROLES, UserService


@pytest.mark.asyncio
async def test_seed_roles(db_session: AsyncSession):
    svc = UserService(db_session)
    await svc.seed_roles()
    await db_session.commit()

    roles = await svc.list_roles()
    role_names = [r.name for r in roles]
    for r in DEFAULT_ROLES:
        assert r in role_names

    # Test idempotency (calling again should not raise or duplicate)
    await svc.seed_roles()
    await db_session.commit()
    roles2 = await svc.list_roles()
    assert len(roles2) == len(roles)


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    svc = UserService(db_session)
    create_payload = UserCreate(email="TEST.User@srmap.edu.in", status="PENDING")
    user = await svc.create_user(create_payload)
    await db_session.commit()

    assert user.id is not None
    # Email should be normalised to lower case
    assert user.email == "test.user@srmap.edu.in"
    assert user.status == "PENDING"


@pytest.mark.asyncio
async def test_create_duplicate_user_fails(db_session: AsyncSession):
    svc = UserService(db_session)
    create_payload = UserCreate(email="dup@srmap.edu.in")
    await svc.create_user(create_payload)
    await db_session.commit()

    with pytest.raises(ValueError, match="already exists"):
        await svc.create_user(UserCreate(email="DUP@srmap.edu.in"))


@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    svc = UserService(db_session)
    user = await svc.create_user(UserCreate(email="lookup@srmap.edu.in"))
    await db_session.commit()

    fetched = await svc.get_user(user.id)
    assert fetched.id == user.id
    assert fetched.email == "lookup@srmap.edu.in"

    with pytest.raises(LookupError, match="not found"):
        await svc.get_user(uuid.uuid4())


@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    svc = UserService(db_session)
    user = await svc.create_user(UserCreate(email="orig@srmap.edu.in", status="PENDING"))
    await db_session.commit()

    # Update status to ACTIVE
    updated = await svc.update_user(user.id, UserUpdate(status="ACTIVE"))
    await db_session.commit()
    assert updated.status == "ACTIVE"

    # Update email
    updated2 = await svc.update_user(user.id, UserUpdate(email="NEW@srmap.edu.in"))
    await db_session.commit()
    assert updated2.email == "new@srmap.edu.in"


@pytest.mark.asyncio
async def test_assign_and_revoke_role(db_session: AsyncSession):
    svc = UserService(db_session)
    await svc.seed_roles()
    user = await svc.create_user(UserCreate(email="roleuser@srmap.edu.in"))
    await db_session.commit()

    # Assign STUDENT
    user_role = await svc.assign_role(user.id, "STUDENT")
    await db_session.commit()
    assert user_role.user_id == user.id

    # Verify idempotency
    ur2 = await svc.assign_role(user.id, "STUDENT")
    assert ur2.user_id == user.id

    # Revoke role
    await svc.revoke_role(user.id, "STUDENT")
    await db_session.commit()

    # Reload user
    reloaded = await svc.get_user(user.id)
    active_roles = [ur.role.name for ur in reloaded.user_roles]
    assert "STUDENT" not in active_roles
