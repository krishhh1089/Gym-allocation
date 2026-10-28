import asyncio
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.role import Role, UserRole
from app.models.user import User
from app.services.auth_service import create_access_token

# Test database: in-memory SQLite with aiosqlite
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


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
async def async_client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token():
    token, _ = create_access_token(
        user_id=uuid.uuid4(),
        email="admin@srmap.edu.in",
        roles=["ADMIN"],
        status="ACTIVE",
    )
    return token


@pytest.fixture
def super_admin_token():
    token, _ = create_access_token(
        user_id=uuid.uuid4(),
        email="superadmin@srmap.edu.in",
        roles=["SUPER_ADMIN"],
        status="ACTIVE",
    )
    return token


@pytest.fixture
def student_token():
    user_id = uuid.uuid4()
    token, _ = create_access_token(
        user_id=user_id,
        email="student@srmap.edu.in",
        roles=["STUDENT"],
        status="ACTIVE",
    )
    return token, user_id
