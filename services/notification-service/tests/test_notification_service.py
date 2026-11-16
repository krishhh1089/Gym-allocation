"""
Unit tests for the Notification Service business logic.
"""

import uuid
import pytest

from app.exceptions.notification_exceptions import (
    AnnouncementNotFoundError,
    NotificationJobNotFoundError,
    NotificationNotFoundError,
    NotificationTemplateNotFoundError,
)
from app.models.notification import (
    JobStatus,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
)
from app.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService


@pytest.mark.asyncio
async def test_send_in_app_notification(db_session):
    repo = NotificationRepository(db_session)
    svc = NotificationService(repo)

    user_id = uuid.uuid4()
    notif = await svc.send_notification(
        user_id=user_id,
        subject="Slot Allocation Confirmed",
        message="Your slot for Gym A (06:00 - 07:00) has been allocated.",
        type=NotificationType.ALLOCATION_CONFIRMED,
        channel=NotificationChannel.IN_APP,
    )

    assert notif.id is not None
    assert notif.user_id == user_id
    assert notif.status == NotificationStatus.SENT
    assert notif.sent_at is not None
    assert notif.read_at is None


@pytest.mark.asyncio
async def test_send_email_notification_creates_job(db_session):
    repo = NotificationRepository(db_session)
    svc = NotificationService(repo)

    user_id = uuid.uuid4()
    notif = await svc.send_notification(
        user_id=user_id,
        subject="Absence Warning Notice",
        message="You have accumulated 3 consecutive unexcused absences.",
        type=NotificationType.ABSENCE_WARNING,
        channel=NotificationChannel.EMAIL,
    )

    assert notif.id is not None
    assert notif.channel == NotificationChannel.EMAIL

    fetched = await svc.get_notification(notif.id)
    assert len(fetched.jobs) >= 1
    assert fetched.jobs[0].status in (JobStatus.QUEUED, JobStatus.SUCCESS)


@pytest.mark.asyncio
async def test_deduplication_key_idempotency(db_session):
    repo = NotificationRepository(db_session)
    svc = NotificationService(repo)

    user_id = uuid.uuid4()
    dedup_key = f"absence-warning-{user_id}-session-123"

    # First send
    notif1 = await svc.send_notification(
        user_id=user_id,
        subject="Warning",
        message="Warning text",
        type=NotificationType.ABSENCE_WARNING,
        channel=NotificationChannel.IN_APP,
        deduplication_key=dedup_key,
    )

    # Second send with same deduplication key
    notif2 = await svc.send_notification(
        user_id=user_id,
        subject="Duplicate Warning",
        message="Different text",
        type=NotificationType.ABSENCE_WARNING,
        channel=NotificationChannel.IN_APP,
        deduplication_key=dedup_key,
    )

    assert notif1.id == notif2.id
    assert notif2.subject == "Warning"


@pytest.mark.asyncio
async def test_templated_notification_rendering(db_session):
    repo = NotificationRepository(db_session)
    svc = NotificationService(repo)

    # Create template
    await svc.create_template(
        code="WAITLIST_PROMOTED_TPL",
        channel=NotificationChannel.EMAIL,
        subject_template="Good news {{student_name}}, you have been promoted!",
        body_template="Dear {{student_name}}, your waitlist application for {{slot_name}} has been confirmed.",
    )

    user_id = uuid.uuid4()
    notif = await svc.send_templated_notification(
        user_id=user_id,
        template_code="WAITLIST_PROMOTED_TPL",
        context={"student_name": "Aarav", "slot_name": "Morning Slot A"},
        type=NotificationType.WAITLIST_PROMOTED,
    )

    assert "Good news Aarav, you have been promoted!" in notif.subject
    assert "Morning Slot A has been confirmed." in notif.message


@pytest.mark.asyncio
async def test_read_and_unread_notifications(db_session):
    repo = NotificationRepository(db_session)
    svc = NotificationService(repo)

    user_id = uuid.uuid4()
    n1 = await svc.send_notification(user_id=user_id, subject="N1", message="M1")
    n2 = await svc.send_notification(user_id=user_id, subject="N2", message="M2")

    items, total, unread = await svc.list_user_notifications(user_id)
    assert total == 2
    assert unread == 2

    # Mark n1 as read
    await svc.mark_as_read(n1.id, user_id=user_id)
    items, total, unread = await svc.list_user_notifications(user_id)
    assert unread == 1

    # Mark all read
    marked = await svc.mark_all_as_read(user_id)
    assert marked == 1
    items, total, unread = await svc.list_user_notifications(user_id)
    assert unread == 0


@pytest.mark.asyncio
async def test_announcements_workflow(db_session):
    repo = NotificationRepository(db_session)
    svc = NotificationService(repo)

    admin_id = uuid.uuid4()
    ann = await svc.create_announcement(
        title="Gym Maintenance Scheduled",
        content="Gym B will remain closed this Saturday for routine maintenance.",
        author_id=admin_id,
        target_role="ALL",
    )

    assert ann.id is not None
    assert ann.is_published is True

    items, total = await svc.list_announcements(target_role="STUDENT")
    assert total >= 1

    # Delete announcement
    deleted = await svc.delete_announcement(ann.id)
    assert deleted is True

    with pytest.raises(AnnouncementNotFoundError):
        await svc.get_announcement(ann.id)


@pytest.mark.asyncio
async def test_job_retry_workflow(db_session):
    repo = NotificationRepository(db_session)
    svc = NotificationService(repo)

    user_id = uuid.uuid4()
    notif = await repo.create_notification(
        user_id=user_id,
        type=NotificationType.GENERAL,
        channel=NotificationChannel.EMAIL,
        subject="Retry Test",
        message="Body",
        status=NotificationStatus.FAILED,
    )
    job = await repo.create_job(notif.id)
    job.status = JobStatus.DEAD_LETTER
    job.retry_count = 3
    await db_session.flush()

    retried_job = await svc.retry_job(job.id)
    assert retried_job.status == JobStatus.QUEUED
    assert retried_job.retry_count == 0
