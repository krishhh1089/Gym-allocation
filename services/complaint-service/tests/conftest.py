"""
Test configuration and fixtures for the Complaint Service test suite.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

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


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
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
    import app.config as config_module

    monkeypatch.setattr(config_module.settings, "secret_key", TEST_SECRET_KEY)
    monkeypatch.setattr(config_module.settings, "jwt_secret", TEST_SECRET_KEY)
    monkeypatch.setattr(config_module.settings, "jwt_algorithm", TEST_JWT_ALGORITHM)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def trainer_user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def student_user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def admin_token(admin_user_id: uuid.UUID) -> str:
    return _make_token(
        user_id=admin_user_id,
        email="admin@srmap.edu.in",
        roles=["ADMIN"],
    )


@pytest.fixture
def trainer_token(trainer_user_id: uuid.UUID) -> str:
    return _make_token(
        user_id=trainer_user_id,
        email="trainer@srmap.edu.in",
        roles=["TRAINER"],
    )


@pytest.fixture
def student_token(student_user_id: uuid.UUID) -> str:
    return _make_token(
        user_id=student_user_id,
        email="student@srmap.edu.in",
        roles=["STUDENT"],
    )
