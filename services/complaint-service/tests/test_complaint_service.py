"""
Unit tests for the Complaint Service business logic.
"""

import uuid
import pytest

from app.exceptions.complaint_exceptions import (
    ComplaintNotFoundError,
    InvalidStatusTransitionError,
    SupportRequestNotFoundError,
)
from app.models.complaint import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
    SupportCategory,
    SupportStatus,
)
from app.repositories.complaint_repository import ComplaintRepository
from app.services.complaint_service import ComplaintService


@pytest.mark.asyncio
async def test_create_and_get_complaint(db_session):
    repo = ComplaintRepository(db_session)
    svc = ComplaintService(repo)

    student_id = uuid.uuid4()
    complaint = await svc.create_complaint(
        student_id=student_id,
        submitted_by=student_id,
        category=ComplaintCategory.EQUIPMENT,
        title="Broken Cable Pulley Machine",
        description="The cable on station 3 has frayed and snapped during workout.",
        priority=ComplaintPriority.HIGH,
    )

    assert complaint.id is not None
    assert complaint.status == ComplaintStatus.OPEN
    assert complaint.priority == ComplaintPriority.HIGH

    fetched = await svc.get_complaint(complaint.id)
    assert fetched.id == complaint.id
    assert fetched.title == "Broken Cable Pulley Machine"


@pytest.mark.asyncio
async def test_complaint_assignment_and_lifecycle(db_session):
    repo = ComplaintRepository(db_session)
    svc = ComplaintService(repo)

    student_id = uuid.uuid4()
    admin_id = uuid.uuid4()

    complaint = await svc.create_complaint(
        student_id=student_id,
        submitted_by=student_id,
        category=ComplaintCategory.CLEANLINESS,
        title="Sanitizer dispenser empty",
        description="Sanitizer bottle near dumbbell rack needs refill.",
    )
    assert complaint.status == ComplaintStatus.OPEN

    # Assigning to staff moves status to IN_PROGRESS
    assigned = await svc.assign_complaint(complaint.id, admin_id)
    assert assigned.assigned_to == admin_id
    assert assigned.status == ComplaintStatus.IN_PROGRESS

    # Add comment
    comment = await svc.add_comment(
        complaint_id=complaint.id,
        user_id=admin_id,
        comment="Staff notified, replenishing supplies.",
    )
    assert comment.id is not None
    assert comment.comment == "Staff notified, replenishing supplies."

    # Resolve complaint
    resolved = await svc.update_status(
        complaint_id=complaint.id,
        status=ComplaintStatus.RESOLVED,
        resolution_notes="Dispenser refilled with sanitizer.",
    )
    assert resolved.status == ComplaintStatus.RESOLVED
    assert resolved.resolved_at is not None
    assert resolved.resolution_notes == "Dispenser refilled with sanitizer."

    # Close complaint
    closed = await svc.update_status(complaint.id, ComplaintStatus.CLOSED)
    assert closed.status == ComplaintStatus.CLOSED

    # Cannot reopen closed complaint
    with pytest.raises(InvalidStatusTransitionError):
        await svc.update_status(complaint.id, ComplaintStatus.OPEN)


@pytest.mark.asyncio
async def test_support_request_workflow(db_session):
    repo = ComplaintRepository(db_session)
    svc = ComplaintService(repo)

    student_id = uuid.uuid4()
    req = await svc.create_support_request(
        student_id=student_id,
        category=SupportCategory.ATTENDANCE,
        title="Missing attendance mark for yesterday",
        description="I attended slot 17:00 but scanner showed error.",
    )

    assert req.id is not None
    assert req.status == SupportStatus.OPEN
    assert req.category == SupportCategory.ATTENDANCE

    # List support requests
    items, total = await svc.list_support_requests(student_id=student_id)
    assert total == 1
    assert items[0].id == req.id

    # Resolve support request
    staff_id = uuid.uuid4()
    updated = await svc.update_support_request(
        request_id=req.id,
        status=SupportStatus.RESOLVED,
        resolution="Verified CCTV log, attendance record retroactively marked.",
        assigned_to=staff_id,
    )

    assert updated.status == SupportStatus.RESOLVED
    assert updated.assigned_to == staff_id
    assert updated.resolved_at is not None
