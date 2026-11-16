import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.config import settings
from app.exceptions.notification_exceptions import (
    AnnouncementNotFoundError,
    NotificationJobNotFoundError,
    NotificationNotFoundError,
    NotificationTemplateNotFoundError,
    TemplateRenderError,
)
from app.models.notification import (
    Announcement,
    JobStatus,
    Notification,
    NotificationChannel,
    NotificationJob,
    NotificationStatus,
    NotificationTemplate,
    NotificationType,
)
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, repository: NotificationRepository):
        self.repo = repository

    # ---------------------------------------------------------------------------
    # Notifications
    # ---------------------------------------------------------------------------

    async def send_notification(
        self,
        user_id: uuid.UUID,
        subject: str,
        message: str,
        type: NotificationType = NotificationType.GENERAL,
        channel: NotificationChannel = NotificationChannel.IN_APP,
        deduplication_key: Optional[str] = None,
    ) -> Notification:
        # 1. Idempotency check via deduplication_key
        if deduplication_key:
            existing = await self.repo.get_by_deduplication_key(deduplication_key)
            if existing:
                return existing

        now = datetime.now(timezone.utc)
        # 2. In-app notifications are delivered immediately
        if channel == NotificationChannel.IN_APP:
            notification = await self.repo.create_notification(
                user_id=user_id,
                type=type,
                channel=channel,
                subject=subject,
                message=message,
                deduplication_key=deduplication_key,
                status=NotificationStatus.SENT,
                sent_at=now,
            )
            return notification

        # 3. For async channels (EMAIL, SMS, PUSH), create record and delivery job
        notification = await self.repo.create_notification(
            user_id=user_id,
            type=type,
            channel=channel,
            subject=subject,
            message=message,
            deduplication_key=deduplication_key,
            status=NotificationStatus.PENDING,
        )

        job = await self.repo.create_job(
            notification_id=notification.id,
            max_retries=settings.default_max_retries,
        )

        # In dev/test environment, simulate immediate successful dispatch
        notification.status = NotificationStatus.SENT
        notification.sent_at = now
        job.status = JobStatus.SUCCESS
        await self.repo.session.flush()

        return notification

    async def send_templated_notification(
        self,
        user_id: uuid.UUID,
        template_code: str,
        context: Dict[str, Any],
        type: NotificationType = NotificationType.GENERAL,
        channel: Optional[NotificationChannel] = None,
        deduplication_key: Optional[str] = None,
    ) -> Notification:
        template = await self.repo.get_template_by_code(template_code)
        if not template or not template.is_active:
            raise NotificationTemplateNotFoundError(f"Template {template_code} not found or inactive")

        target_channel = channel or template.channel
        subject = self._render(template.subject_template, context)
        message = self._render(template.body_template, context)

        return await self.send_notification(
            user_id=user_id,
            subject=subject,
            message=message,
            type=type,
            channel=target_channel,
            deduplication_key=deduplication_key,
        )

    def _render(self, template_str: str, context: Dict[str, Any]) -> str:
        try:
            rendered = template_str
            for key, val in context.items():
                pattern = re.compile(rf"\{{\{{\s*{re.escape(key)}\s*\}}\}}")
                rendered = pattern.sub(str(val), rendered)
            return rendered
        except Exception as exc:
            raise TemplateRenderError(f"Failed to render template: {exc}")

    async def get_notification(self, notification_id: uuid.UUID) -> Notification:
        notification = await self.repo.get_by_id(notification_id)
        if not notification:
            raise NotificationNotFoundError(f"Notification {notification_id} not found")
        return notification

    async def list_user_notifications(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Notification], int, int]:
        return await self.repo.list_user_notifications(
            user_id=user_id,
            unread_only=unread_only,
            page=page,
            size=size,
        )

    async def list_notifications(
        self,
        user_id: Optional[uuid.UUID] = None,
        type: Optional[NotificationType] = None,
        channel: Optional[NotificationChannel] = None,
        status: Optional[NotificationStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Notification], int]:
        return await self.repo.list_notifications(
            user_id=user_id,
            type=type,
            channel=channel,
            status=status,
            page=page,
            size=size,
        )

    async def mark_as_read(
        self,
        notification_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        notification = await self.get_notification(notification_id)
        if user_id and notification.user_id != user_id:
            raise NotificationNotFoundError(f"Notification {notification_id} not found for user")
        updated = await self.repo.mark_as_read(notification_id)
        return updated  # type: ignore

    async def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        return await self.repo.mark_all_user_notifications_read(user_id)

    # ---------------------------------------------------------------------------
    # Announcements
    # ---------------------------------------------------------------------------

    async def create_announcement(
        self,
        title: str,
        content: str,
        author_id: uuid.UUID,
        target_role: str = "ALL",
        is_published: bool = True,
    ) -> Announcement:
        return await self.repo.create_announcement(
            title=title,
            content=content,
            target_role=target_role,
            author_id=author_id,
            is_published=is_published,
        )

    async def get_announcement(self, announcement_id: uuid.UUID) -> Announcement:
        announcement = await self.repo.get_announcement_by_id(announcement_id)
        if not announcement:
            raise AnnouncementNotFoundError(f"Announcement {announcement_id} not found")
        return announcement

    async def list_announcements(
        self,
        target_role: Optional[str] = None,
        is_published: Optional[bool] = True,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Announcement], int]:
        return await self.repo.list_announcements(
            target_role=target_role,
            is_published=is_published,
            page=page,
            size=size,
        )

    async def delete_announcement(self, announcement_id: uuid.UUID) -> bool:
        announcement = await self.get_announcement(announcement_id)
        return await self.repo.delete_announcement(announcement_id)

    # ---------------------------------------------------------------------------
    # Templates
    # ---------------------------------------------------------------------------

    async def create_template(
        self,
        code: str,
        channel: NotificationChannel,
        subject_template: str,
        body_template: str,
    ) -> NotificationTemplate:
        return await self.repo.create_template(
            code=code,
            channel=channel,
            subject_template=subject_template,
            body_template=body_template,
        )

    async def get_template(self, code: str) -> NotificationTemplate:
        template = await self.repo.get_template_by_code(code)
        if not template:
            raise NotificationTemplateNotFoundError(f"Template {code} not found")
        return template

    async def list_templates(self, is_active: Optional[bool] = None) -> List[NotificationTemplate]:
        return await self.repo.list_templates(is_active=is_active)

    async def update_template(
        self,
        code: str,
        subject_template: Optional[str] = None,
        body_template: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> NotificationTemplate:
        template = await self.repo.update_template(
            code=code,
            subject_template=subject_template,
            body_template=body_template,
            is_active=is_active,
        )
        if not template:
            raise NotificationTemplateNotFoundError(f"Template {code} not found")
        return template

    # ---------------------------------------------------------------------------
    # Delivery Jobs
    # ---------------------------------------------------------------------------

    async def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[NotificationJob], int]:
        return await self.repo.list_jobs(status=status, page=page, size=size)

    async def retry_job(self, job_id: uuid.UUID) -> NotificationJob:
        job = await self.repo.get_job_by_id(job_id)
        if not job:
            raise NotificationJobNotFoundError(f"Job {job_id} not found")

        job.status = JobStatus.QUEUED
        job.retry_count = 0
        job.next_attempt_at = datetime.now(timezone.utc)
        job.error_message = None
        await self.repo.session.flush()
        return job
