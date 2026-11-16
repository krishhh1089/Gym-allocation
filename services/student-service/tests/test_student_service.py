"""
Unit tests for StudentService business logic.
Covers all 8 required test scenarios.
"""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.student_exceptions import (
    DuplicateRegistrationNumberError,
    StudentNotFoundError,
)
from app.models.student import AccountStatus
from app.schemas.student import (
    StudentAdminUpdate,
    StudentCreate,
    StudentStatusUpdate,
    StudentUpdate,
)
from app.services.student_service import StudentService


def _make_create_payload(
    reg_number: str = "AP21TEST001",
    email: str = "svctest001@srmap.edu.in",
    **kwargs,
) -> StudentCreate:
    defaults = dict(
        registration_number=reg_number,
        full_name="Test Student",
        email=email,
        department="CSE",
        programme="B.Tech",
        academic_year=1,
        semester=1,
    )
    defaults.update(kwargs)
    return StudentCreate(**defaults)


# ── 1. Create student — success ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_student_success(db_session: AsyncSession):
    svc = StudentService(db_session)
    payload = _make_create_payload()
    student = await svc.create_student(payload)
    await db_session.commit()

    assert student.id is not None
    assert student.registration_number == "AP21TEST001"
    assert student.email == "svctest001@srmap.edu.in"
    assert student.account_status == AccountStatus.PENDING


# ── 2. Create student — duplicate reg number raises exception ─────────────────

@pytest.mark.asyncio
async def test_create_student_duplicate_reg_raises(db_session: AsyncSession):
    svc = StudentService(db_session)
    await svc.create_student(_make_create_payload(reg_number="AP21DUP001", email="duptest1@srmap.edu.in"))
    await db_session.commit()

    with pytest.raises(DuplicateRegistrationNumberError):
        await svc.create_student(_make_create_payload(reg_number="AP21DUP001", email="duptest2@srmap.edu.in"))


# ── 3. Get by ID — found ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_student_by_id_found(db_session: AsyncSession):
    svc = StudentService(db_session)
    created = await svc.create_student(_make_create_payload(reg_number="AP21GET001", email="gettest001@srmap.edu.in"))
    await db_session.commit()

    fetched = await svc.get_student(created.id)
    assert fetched.id == created.id
    assert fetched.registration_number == "AP21GET001"


# ── 4. Get by ID — not found returns None / raises exception ──────────────────

@pytest.mark.asyncio
async def test_get_student_by_id_not_found(db_session: AsyncSession):
    svc = StudentService(db_session)
    with pytest.raises(StudentNotFoundError):
        await svc.get_student(uuid.uuid4())


# ── 5. Get by identity user ID ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_student_by_identity_user_id(db_session: AsyncSession):
    svc = StudentService(db_session)
    user_id = uuid.uuid4()
    await svc.create_student(
        _make_create_payload(
            reg_number="AP21IUID001",
            email="iuid001@srmap.edu.in",
            identity_user_id=user_id,
        )
    )
    await db_session.commit()

    student = await svc.get_student_by_identity_user_id(user_id)
    assert student is not None
    assert student.identity_user_id == user_id

    # Non-existent user_id returns None
    result = await svc.get_student_by_identity_user_id(uuid.uuid4())
    assert result is None


# ── 6. List with pagination ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_students_pagination(db_session: AsyncSession):
    svc = StudentService(db_session)
    for i in range(5):
        await svc.create_student(
            _make_create_payload(
                reg_number=f"AP21PG{i:03d}",
                email=f"pgtest{i}@srmap.edu.in",
            )
        )
    await db_session.commit()

    result = await svc.list_students(skip=0, limit=3)
    assert len(result.items) == 3
    assert result.total >= 5
    assert result.skip == 0
    assert result.limit == 3

    result2 = await svc.list_students(skip=3, limit=3)
    assert result2.skip == 3


# ── 7. Update student ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_student(db_session: AsyncSession):
    svc = StudentService(db_session)
    student = await svc.create_student(
        _make_create_payload(reg_number="AP21UPD001", email="upd001@srmap.edu.in")
    )
    await db_session.commit()

    # Student self-update (phone_number)
    user_id = uuid.uuid4()
    student.identity_user_id = user_id
    db_session.add(student)
    await db_session.commit()

    updated = await svc.update_my_profile(user_id, StudentUpdate(phone_number="9999999999"))
    await db_session.commit()
    assert updated.phone_number == "9999999999"

    # Admin update
    admin_updated = await svc.admin_update_student(
        student.id,
        StudentAdminUpdate(full_name="New Name", semester=5),
    )
    await db_session.commit()
    assert admin_updated.full_name == "New Name"
    assert admin_updated.semester == 5


# ── 8. Update status ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_student_status(db_session: AsyncSession):
    svc = StudentService(db_session)
    student = await svc.create_student(
        _make_create_payload(reg_number="AP21ST001", email="st001@srmap.edu.in")
    )
    await db_session.commit()

    assert student.account_status == AccountStatus.PENDING

    updated = await svc.update_status(
        student.id, StudentStatusUpdate(account_status=AccountStatus.ACTIVE)
    )
    await db_session.commit()
    assert updated.account_status == AccountStatus.ACTIVE

    suspended = await svc.update_status(
        student.id, StudentStatusUpdate(account_status=AccountStatus.SUSPENDED)
    )
    await db_session.commit()
    assert suspended.account_status == AccountStatus.SUSPENDED
