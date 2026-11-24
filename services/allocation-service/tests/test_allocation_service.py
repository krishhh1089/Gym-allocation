"""
Unit tests for AllocationService domain logic.
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.allocation_exceptions import (
    ActiveAllocationConflictError,
    DuplicateApplicationError,
    RegistrationWindowClosedError,
    SlotFullError,
)
from app.models.base import utcnow
from app.schemas.allocation import (
    ApplicationCreate,
    RegistrationWindowCreate,
    SlotCapacitySet,
    SlotChangeRequestCreate,
    SlotChangeRequestReview,
)
from app.services.allocation_service import AllocationService


@pytest.mark.asyncio
async def test_create_and_get_registration_window(db_session: AsyncSession):
    svc = AllocationService(db_session)
    now = utcnow()
    payload = RegistrationWindowCreate(
        name="Spring 2026 Window",
        opens_at=now - timedelta(days=1),
        closes_at=now + timedelta(days=5),
        status="OPEN",
    )
    window = await svc.create_window(payload)
    await db_session.commit()
    assert window.id is not None
    assert window.name == "Spring 2026 Window"
    assert window.is_currently_open(now) is True


@pytest.mark.asyncio
async def test_apply_when_window_closed_raises(db_session: AsyncSession):
    svc = AllocationService(db_session)
    now = utcnow()
    # Window closed
    window = await svc.create_window(
        RegistrationWindowCreate(
            name="Past Window",
            opens_at=now - timedelta(days=10),
            closes_at=now - timedelta(days=5),
            status="CLOSED",
        )
    )
    await db_session.commit()

    student_id = uuid.uuid4()
    slot_id = uuid.uuid4()
    with pytest.raises(RegistrationWindowClosedError):
        await svc.apply_for_slot(
            student_id,
            ApplicationCreate(slot_id=slot_id, registration_window_id=window.id),
        )


@pytest.mark.asyncio
async def test_apply_immediate_allocation_within_capacity(db_session: AsyncSession):
    svc = AllocationService(db_session)
    now = utcnow()
    window = await svc.create_window(
        RegistrationWindowCreate(
            name="Open Reg Window",
            opens_at=now - timedelta(hours=1),
            closes_at=now + timedelta(days=7),
            status="OPEN",
        )
    )
    slot_id = uuid.uuid4()
    await svc.set_slot_capacity(SlotCapacitySet(slot_id=slot_id, max_capacity=2))
    await db_session.commit()

    student_id = uuid.uuid4()
    app_obj = await svc.apply_for_slot(
        student_id,
        ApplicationCreate(slot_id=slot_id, registration_window_id=window.id),
    )
    await db_session.commit()
    assert app_obj.status == "APPROVED"

    # Verify active allocation created
    alloc = await svc._repo.get_active_allocation_by_student(student_id)
    assert alloc is not None
    assert alloc.status == "ACTIVE"
    assert alloc.slot_id == slot_id


@pytest.mark.asyncio
async def test_apply_waitlisted_when_capacity_reached(db_session: AsyncSession):
    svc = AllocationService(db_session)
    now = utcnow()
    window = await svc.create_window(
        RegistrationWindowCreate(
            name="Waitlist Test Window",
            opens_at=now - timedelta(hours=1),
            closes_at=now + timedelta(days=7),
            status="OPEN",
        )
    )
    slot_id = uuid.uuid4()
    # Capacity is 1
    await svc.set_slot_capacity(SlotCapacitySet(slot_id=slot_id, max_capacity=1))
    await db_session.commit()

    student1 = uuid.uuid4()
    app1 = await svc.apply_for_slot(
        student1,
        ApplicationCreate(slot_id=slot_id, registration_window_id=window.id),
    )
    await db_session.commit()
    assert app1.status == "APPROVED"

    student2 = uuid.uuid4()
    app2 = await svc.apply_for_slot(
        student2,
        ApplicationCreate(slot_id=slot_id, registration_window_id=window.id),
    )
    await db_session.commit()
    assert app2.status == "WAITLISTED"

    # Check waitlist position
    pos_resp = await svc.get_waitlist_position(student2, app2.id)
    assert pos_resp.waitlist_position == 1
    assert pos_resp.total_waitlisted == 1


@pytest.mark.asyncio
async def test_duplicate_application_in_same_window_rejected(
    db_session: AsyncSession,
):
    svc = AllocationService(db_session)
    now = utcnow()
    window = await svc.create_window(
        RegistrationWindowCreate(
            name="Dup Test Window",
            opens_at=now - timedelta(hours=1),
            closes_at=now + timedelta(days=7),
            status="OPEN",
        )
    )
    slot_id = uuid.uuid4()
    await svc.set_slot_capacity(SlotCapacitySet(slot_id=slot_id, max_capacity=10))
    await db_session.commit()

    student_id = uuid.uuid4()
    await svc.apply_for_slot(
        student_id,
        ApplicationCreate(slot_id=slot_id, registration_window_id=window.id),
    )
    await db_session.commit()

    with pytest.raises(ActiveAllocationConflictError):
        await svc.apply_for_slot(
            student_id,
            ApplicationCreate(slot_id=slot_id, registration_window_id=window.id),
        )


@pytest.mark.asyncio
async def test_generate_and_verify_gym_card_token(db_session: AsyncSession):
    svc = AllocationService(db_session)
    now = utcnow()
    window = await svc.create_window(
        RegistrationWindowCreate(
            name="QR Window",
            opens_at=now - timedelta(hours=1),
            closes_at=now + timedelta(days=7),
            status="OPEN",
        )
    )
    slot_id = uuid.uuid4()
    student_id = uuid.uuid4()
    await svc.set_slot_capacity(SlotCapacitySet(slot_id=slot_id, max_capacity=5))
    await svc.apply_for_slot(
        student_id,
        ApplicationCreate(slot_id=slot_id, registration_window_id=window.id),
    )
    await db_session.commit()

    # Generate QR token
    token_resp = await svc.generate_card_token(student_id)
    await db_session.commit()
    assert token_resp.token is not None
    assert token_resp.token_hash is not None

    # Verify QR token
    verify_resp = await svc.verify_card_token(token_resp.token)
    assert verify_resp.is_valid is True
    assert verify_resp.student_id == student_id
    assert verify_resp.slot_id == slot_id


@pytest.mark.asyncio
async def test_slot_transfer_workflow_with_waitlist_promotion(
    db_session: AsyncSession,
):
    svc = AllocationService(db_session)
    now = utcnow()
    window = await svc.create_window(
        RegistrationWindowCreate(
            name="Transfer Window",
            opens_at=now - timedelta(hours=1),
            closes_at=now + timedelta(days=7),
            status="OPEN",
        )
    )
    slotA = uuid.uuid4()
    slotB = uuid.uuid4()
    await svc.set_slot_capacity(SlotCapacitySet(slot_id=slotA, max_capacity=1))
    await svc.set_slot_capacity(SlotCapacitySet(slot_id=slotB, max_capacity=1))
    await db_session.commit()

    # Student 1 gets slot A
    student1 = uuid.uuid4()
    await svc.apply_for_slot(
        student1,
        ApplicationCreate(slot_id=slotA, registration_window_id=window.id),
    )
    # Student 2 is waitlisted on slot A
    student2 = uuid.uuid4()
    app2 = await svc.apply_for_slot(
        student2,
        ApplicationCreate(slot_id=slotA, registration_window_id=window.id),
    )
    await db_session.commit()
    assert app2.status == "WAITLISTED"

    # Student 1 requests transfer to Slot B (which has 1 empty seat)
    alloc1 = await svc._repo.get_active_allocation_by_student(student1)
    req = await svc.request_slot_transfer(
        student1,
        SlotChangeRequestCreate(
            current_allocation_id=alloc1.id,
            requested_slot_id=slotB,
            reason="Change schedule",
        ),
    )
    await db_session.commit()
    assert req.status == "PENDING"
    # Crucial safety check: Student 1 still holds active allocation during review!
    assert (await svc._repo.get_active_allocation_by_student(student1)).slot_id == slotA

    # Admin approves transfer
    admin_id = uuid.uuid4()
    await svc.review_slot_transfer(
        req.id,
        SlotChangeRequestReview(action="APPROVE"),
        reviewer_id=admin_id,
    )
    await db_session.commit()

    # Verify Student 1 now has Slot B active
    new_alloc1 = await svc._repo.get_active_allocation_by_student(student1)
    assert new_alloc1.slot_id == slotB

    # Verify Student 2 was AUTOMATICALLY PROMOTED to Slot A!
    promoted_alloc2 = await svc._repo.get_active_allocation_by_student(student2)
    assert promoted_alloc2 is not None
    assert promoted_alloc2.slot_id == slotA
    assert promoted_alloc2.status == "ACTIVE"
