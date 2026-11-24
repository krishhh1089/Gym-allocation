"""
Unit tests for the Attendance Service business logic.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

import pytest

from app.exceptions.attendance_exceptions import (
    AttendanceCorrectionError,
    AttendanceRecordNotFoundError,
    AttendanceSessionNotFoundError,
    DuplicateAttendanceError,
    ExemptionAlreadyExistsError,
    InvalidTokenError,
    SessionCancelledError,
    SessionNotOpenError,
)
from app.models.attendance import (
    AttendanceRecord,
    AttendanceStatus,
    CheckInMethod,
    GymCardToken,
    SessionStatus,
)
from app.repositories.attendance_repository import AttendanceRepository
from app.services.attendance_service import AttendanceService


@pytest.mark.asyncio
async def test_create_session(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now + timedelta(hours=1)
    ends = now + timedelta(hours=2)

    session = await svc.create_session(slot_id, today, starts, ends)
    assert session.id is not None
    assert session.slot_id == slot_id
    assert session.status == SessionStatus.SCHEDULED


@pytest.mark.asyncio
async def test_create_session_invalid_times(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now + timedelta(hours=2)
    ends = now + timedelta(hours=1)

    with pytest.raises(ValueError, match="starts_at must be strictly before ends_at"):
        await svc.create_session(slot_id, today, starts, ends)


@pytest.mark.asyncio
async def test_qr_scan_success(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now - timedelta(minutes=5)
    ends = now + timedelta(minutes=45)

    session = await svc.create_session(slot_id, today, starts, ends)

    student_id = uuid.uuid4()
    allocation_id = uuid.uuid4()
    staff_id = uuid.uuid4()
    raw_token = "secure-qr-token-12345"
    token_hash = GymCardToken.hash_raw_token(raw_token)

    # Register token
    await svc.register_token(
        student_id=student_id,
        allocation_id=allocation_id,
        token_hash=token_hash,
        expires_at=now + timedelta(minutes=15),
        session_id=session.id,
    )

    outcome, record = await svc.process_qr_scan(
        raw_token=raw_token,
        session_id=session.id,
        student_id=student_id,
        allocation_id=allocation_id,
        staff_id=staff_id,
        now=now,
    )

    assert outcome.outcome == "VALID_AND_ELIGIBLE"
    assert record.status == AttendanceStatus.PRESENT
    assert record.method == CheckInMethod.QR_SCAN
    assert record.student_id == student_id


@pytest.mark.asyncio
async def test_qr_scan_outside_window(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now + timedelta(hours=3)
    ends = now + timedelta(hours=4)

    session = await svc.create_session(slot_id, today, starts, ends)

    student_id = uuid.uuid4()
    allocation_id = uuid.uuid4()
    staff_id = uuid.uuid4()

    with pytest.raises(SessionNotOpenError):
        await svc.process_qr_scan(
            raw_token="token",
            session_id=session.id,
            student_id=student_id,
            allocation_id=allocation_id,
            staff_id=staff_id,
            now=now,
        )


@pytest.mark.asyncio
async def test_qr_scan_duplicate_rejected(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now - timedelta(minutes=5)
    ends = now + timedelta(minutes=45)

    session = await svc.create_session(slot_id, today, starts, ends)

    student_id = uuid.uuid4()
    allocation_id = uuid.uuid4()
    staff_id = uuid.uuid4()

    # First check-in
    await svc.process_qr_scan(
        raw_token="token-1",
        session_id=session.id,
        student_id=student_id,
        allocation_id=allocation_id,
        staff_id=staff_id,
        now=now,
    )

    # Second check-in
    with pytest.raises(DuplicateAttendanceError):
        await svc.process_qr_scan(
            raw_token="token-2",
            session_id=session.id,
            student_id=student_id,
            allocation_id=allocation_id,
            staff_id=staff_id,
            now=now,
        )


@pytest.mark.asyncio
async def test_manual_attendance(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now - timedelta(minutes=10)
    ends = now + timedelta(minutes=50)

    session = await svc.create_session(slot_id, today, starts, ends)

    student_id = uuid.uuid4()
    allocation_id = uuid.uuid4()
    staff_id = uuid.uuid4()

    record = await svc.process_manual_attendance(
        session_id=session.id,
        student_id=student_id,
        allocation_id=allocation_id,
        staff_id=staff_id,
        status=AttendanceStatus.PRESENT,
        reason="Camera failure at gate",
        now=now,
    )

    assert record.method == CheckInMethod.MANUAL_FALLBACK
    assert record.staff_id == staff_id
    assert record.status == AttendanceStatus.PRESENT


@pytest.mark.asyncio
async def test_attendance_correction(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now - timedelta(minutes=10)
    ends = now + timedelta(minutes=50)

    session = await svc.create_session(slot_id, today, starts, ends)

    student_id = uuid.uuid4()
    allocation_id = uuid.uuid4()
    staff_id = uuid.uuid4()
    admin_id = uuid.uuid4()

    record = await svc.process_manual_attendance(
        session_id=session.id,
        student_id=student_id,
        allocation_id=allocation_id,
        staff_id=staff_id,
        status=AttendanceStatus.PRESENT,
        now=now,
    )

    corrected, correction = await svc.correct_attendance(
        attendance_id=record.id,
        new_status=AttendanceStatus.INVALIDATED,
        reason="Mistaken student identity verified by CCTV",
        corrected_by=admin_id,
    )

    assert corrected.status == AttendanceStatus.INVALIDATED
    assert correction.old_status == "PRESENT"
    assert correction.new_status == "INVALIDATED"
    assert correction.corrected_by == admin_id


@pytest.mark.asyncio
async def test_attendance_exemption(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    starts = now + timedelta(hours=1)
    ends = now + timedelta(hours=2)

    session = await svc.create_session(slot_id, today, starts, ends)

    student_id = uuid.uuid4()
    admin_id = uuid.uuid4()

    exemption = await svc.create_exemption(
        session_id=session.id,
        student_id=student_id,
        reason="University Sports Meet Participation",
        created_by=admin_id,
    )

    assert exemption.id is not None
    assert exemption.reason == "University Sports Meet Participation"

    # Cannot create duplicate exemption
    with pytest.raises(ExemptionAlreadyExistsError):
        await svc.create_exemption(
            session_id=session.id,
            student_id=student_id,
            reason="Duplicate",
            created_by=admin_id,
        )


@pytest.mark.asyncio
async def test_student_summary_and_consecutive_absences(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    student_id = uuid.uuid4()
    alloc_id = uuid.uuid4()
    base_date = date(2026, 11, 1)

    # Create 3 absent records and 1 present
    for i in range(4):
        s_date = base_date + timedelta(days=i)
        starts = datetime.combine(s_date, datetime.min.time(), tzinfo=timezone.utc)
        ends = starts + timedelta(hours=1)
        sess = await svc.create_session(slot_id, s_date, starts, ends)
        # i=0: PRESENT, i=1,2,3: ABSENT
        st = AttendanceStatus.PRESENT if i == 0 else AttendanceStatus.ABSENT
        await repo.create_record(
            student_id=student_id,
            allocation_id=alloc_id,
            session_id=sess.id,
            session_date=s_date,
            status=st,
        )

    summary = await svc.get_student_summary(student_id)
    assert summary.total_sessions == 4
    assert summary.present_count == 1
    assert summary.absent_count == 3
    assert summary.consecutive_absences == 3


@pytest.mark.asyncio
async def test_absence_candidates_detection(db_session):
    repo = AttendanceRepository(db_session)
    svc = AttendanceService(repo)

    slot_id = uuid.uuid4()
    student_id = uuid.uuid4()
    alloc_id = uuid.uuid4()
    admin_id = uuid.uuid4()

    # Set threshold = 4
    await svc.update_policy(threshold=4, updated_by=admin_id)

    # Add 4 consecutive absences
    base_date = date(2026, 11, 1)
    for i in range(4):
        s_date = base_date + timedelta(days=i)
        starts = datetime.combine(s_date, datetime.min.time(), tzinfo=timezone.utc)
        ends = starts + timedelta(hours=1)
        sess = await svc.create_session(slot_id, s_date, starts, ends)
        await repo.create_record(
            student_id=student_id,
            allocation_id=alloc_id,
            session_id=sess.id,
            session_date=s_date,
            status=AttendanceStatus.ABSENT,
        )

    candidates = await svc.get_absence_candidates()
    assert len(candidates) >= 1
    target = next((c for c in candidates if c.student_id == student_id), None)
    assert target is not None
    assert target.consecutive_absences == 4
    assert target.status == "TERMINATION_CANDIDATE"
