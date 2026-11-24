"""
Test configuration and fixtures for the Student Service test suite.

Uses in-memory SQLite with aiosqlite for fast, dependency-free testing.
JWT tokens are created with SECRET_KEY=test-secret-key.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app

# ── Test database: in-memory SQLite with aiosqlite ────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
TEST_SECRET_KEY = "test-secret-key"
TEST_JWT_ALGORITHM = "HS256"


def _make_token(
    *,
    user_id: uuid.UUID,
    email: str,
    roles: list[str],
    status: str = "ACTIVE",
    secret: str = TEST_SECRET_KEY,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    payload = {
        "sub": str(user_id),
        "email": email,
        "roles": roles,
        "status": status,
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }
    return jwt.encode(payload, secret, algorithm=TEST_JWT_ALGORITHM)


# ── Session-scoped event loop ─────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── Engine / session fixtures ─────────────────────────────────────────────────

@pytest_asyncio.fixture
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine):
    session_factory = async_sessionmaker(
        bind=test_engine,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession, monkeypatch):
    # Patch settings so JWT verification uses the test secret
    import app.api.deps as deps_module
    import app.config as config_module

    monkeypatch.setattr(config_module.settings, "secret_key", TEST_SECRET_KEY)
    monkeypatch.setattr(config_module.settings, "jwt_algorithm", TEST_JWT_ALGORITHM)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


# ── Token fixtures ────────────────────────────────────────────────────────────

@pytest.fixture
def admin_user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def student_user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def trainer_user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def admin_token(admin_user_id) -> str:
    return _make_token(
        user_id=admin_user_id,
        email="admin@srmap.edu.in",
        roles=["ADMIN"],
    )


@pytest.fixture
def student_token(student_user_id) -> str:
    return _make_token(
        user_id=student_user_id,
        email="student@srmap.edu.in",
        roles=["STUDENT"],
    )


@pytest.fixture
def trainer_token(trainer_user_id) -> str:
    return _make_token(
        user_id=trainer_user_id,
        email="trainer@srmap.edu.in",
        roles=["TRAINER"],
    )


@pytest.fixture
def super_admin_token() -> str:
    return _make_token(
        user_id=uuid.uuid4(),
        email="superadmin@srmap.edu.in",
        roles=["SUPER_ADMIN"],
    )


# ── Shared student payload factory ────────────────────────────────────────────

def make_student_payload(
    reg_number: str = "AP21110010001",
    email: str = "student001@srmap.edu.in",
    **kwargs,
) -> dict:
    defaults = {
        "registration_number": reg_number,
        "full_name": "John Doe",
        "email": email,
        "department": "CSE",
        "programme": "B.Tech",
        "academic_year": 2,
        "semester": 3,
        "phone_number": "9876543210",
    }
    defaults.update(kwargs)
    return defaults
