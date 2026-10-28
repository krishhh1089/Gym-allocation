import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserCreate
from app.services.user_service import UserService


@pytest.mark.asyncio
async def test_health(async_client: AsyncClient):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "identity-service"}


@pytest.mark.asyncio
async def test_roles_unauthenticated(async_client: AsyncClient):
    response = await async_client.get("/api/v1/roles/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_roles_authenticated(async_client: AsyncClient, admin_token: str, db_session: AsyncSession):
    svc = UserService(db_session)
    await svc.seed_roles()
    await db_session.commit()

    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await async_client.get("/api/v1/roles/", headers=headers)
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) >= 4
    names = [r["name"] for r in roles]
    assert "STUDENT" in names
    assert "ADMIN" in names


@pytest.mark.asyncio
async def test_create_user_admin_only(
    async_client: AsyncClient,
    admin_token: str,
    student_token: tuple[str, uuid.UUID],
):
    token_student, _ = student_token

    # Student cannot create users (403 Forbidden)
    headers_student = {"Authorization": f"Bearer {token_student}"}
    resp = await async_client.post(
        "/api/v1/users/",
        json={"email": "newbie@srmap.edu.in", "status": "PENDING"},
        headers=headers_student,
    )
    assert resp.status_code == 403

    # Admin CAN create users (201 Created)
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    resp_admin = await async_client.post(
        "/api/v1/users/",
        json={"email": "newbie@srmap.edu.in", "status": "PENDING"},
        headers=headers_admin,
    )
    assert resp_admin.status_code == 201
    data = resp_admin.json()
    assert data["email"] == "newbie@srmap.edu.in"
    assert data["status"] == "PENDING"
    assert "id" in data


@pytest.mark.asyncio
async def test_google_redirect(async_client: AsyncClient):
    response = await async_client.get("/api/v1/auth/google/redirect")
    assert response.status_code == 200
    data = response.json()
    assert "redirect_url" in data
    assert "accounts.google.com" in data["redirect_url"]
    assert "oauth_state" in response.cookies


@pytest.mark.asyncio
async def test_auth_me(
    async_client: AsyncClient,
    student_token: tuple[str, uuid.UUID],
    db_session: AsyncSession,
):
    token, user_id = student_token
    # Provision the user in the database so /me can find it
    svc = UserService(db_session)
    user = await svc.create_user(UserCreate(email="student@srmap.edu.in", status="ACTIVE"))
    user.id = user_id
    await db_session.commit()

    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "student@srmap.edu.in"
    assert data["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_logout(
    async_client: AsyncClient,
    student_token: tuple[str, uuid.UUID],
    db_session: AsyncSession,
):
    token, user_id = student_token
    svc = UserService(db_session)
    user = await svc.create_user(UserCreate(email="student@srmap.edu.in", status="ACTIVE"))
    user.id = user_id
    await db_session.commit()

    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.post("/api/v1/auth/logout", headers=headers)
    assert response.status_code == 204
