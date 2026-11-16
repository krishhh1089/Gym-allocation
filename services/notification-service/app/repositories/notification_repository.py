import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ---------------------------------------------------------------------------
    # Notifications
    # ---------------------------------------------------------------------------

    async def create_notification(
        self,
        user_id: uuid.UUID,
        type: NotificationType,
        channel: NotificationChannel,
        subject: str,
        message: str,
        deduplication_key: Optional[str] = None,
        status: NotificationStatus = NotificationStatus.PENDING,
        sent_at: Optional[datetime] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            channel=channel,
            subject=subject,
            message=message,
            deduplication_key=deduplication_key,
            status=status,
            sent_at=sent_at,
        )
        self.session.add(notification)
        await self.session.flush()
        return notification

    async def get_by_id(self, notification_id: uuid.UUID) -> Optional[Notification]:
        stmt = (
            select(Notification)
            .options(selectinload(Notification.jobs))
            .where(Notification.id == notification_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_deduplication_key(self, key: str) -> Optional[Notification]:
        stmt = select(Notification).where(Notification.deduplication_key == key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_user_notifications(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Notification], int, int]:
        # Unread count
        unread_stmt = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
        unread_count = (await self.session.execute(unread_stmt)).scalar() or 0

        # Query items
        conditions = [Notification.user_id == user_id]
        if unread_only:
            conditions.append(Notification.read_at.is_(None))

        count_stmt = select(func.count(Notification.id)).where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Notification)
            .where(*conditions)
            .order_by(desc(Notification.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total, unread_count

    async def list_notifications(
        self,
        user_id: Optional[uuid.UUID] = None,
        type: Optional[NotificationType] = None,
        channel: Optional[NotificationChannel] = None,
        status: Optional[NotificationStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Notification], int]:
        conditions = []
        if user_id is not None:
            conditions.append(Notification.user_id == user_id)
        if type is not None:
            conditions.append(Notification.type == type)
        if channel is not None:
            conditions.append(Notification.channel == channel)
        if status is not None:
            conditions.append(Notification.status == status)

        count_stmt = select(func.count(Notification.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(Notification)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(Notification.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def mark_as_read(self, notification_id: uuid.UUID) -> Optional[Notification]:
        notification = await self.get_by_id(notification_id)
        if not notification:
            return None
        if notification.read_at is None:
            notification.read_at = datetime.now(timezone.utc)
            notification.status = NotificationStatus.READ
            await self.session.flush()
        return notification

    async def mark_all_user_notifications_read(self, user_id: uuid.UUID) -> int:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.read_at.is_(None),
            )
            .values(read_at=now, status=NotificationStatus.READ)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount

    async def update_status(
        self,
        notification_id: uuid.UUID,
        status: NotificationStatus,
        sent_at: Optional[datetime] = None,
    ) -> Optional[Notification]:
        notification = await self.get_by_id(notification_id)
        if not notification:
            return None
        notification.status = status
        if sent_at:
            notification.sent_at = sent_at
        await self.session.flush()
        return notification

    # ---------------------------------------------------------------------------
    # Announcements
    # ---------------------------------------------------------------------------

    async def create_announcement(
        self,
        title: str,
        content: str,
        target_role: str,
        author_id: uuid.UUID,
        is_published: bool = True,
    ) -> Announcement:
        announcement = Announcement(
            title=title,
            content=content,
            target_role=target_role,
            author_id=author_id,
            is_published=is_published,
        )
        self.session.add(announcement)
        await self.session.flush()
        return announcement

    async def get_announcement_by_id(self, announcement_id: uuid.UUID) -> Optional[Announcement]:
        stmt = select(Announcement).where(Announcement.id == announcement_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_announcements(
        self,
        target_role: Optional[str] = None,
        is_published: Optional[bool] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Announcement], int]:
        conditions = []
        if target_role is not None:
            conditions.append(Announcement.target_role.in_([target_role, "ALL"]))
        if is_published is not None:
            conditions.append(Announcement.is_published == is_published)

        count_stmt = select(func.count(Announcement.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(Announcement)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(Announcement.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def delete_announcement(self, announcement_id: uuid.UUID) -> bool:
        stmt = delete(Announcement).where(Announcement.id == announcement_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0

    # ---------------------------------------------------------------------------
    # Notification Templates
    # ---------------------------------------------------------------------------

    async def create_template(
        self,
        code: str,
        channel: NotificationChannel,
        subject_template: str,
        body_template: str,
    ) -> NotificationTemplate:
        template = NotificationTemplate(
            code=code,
            channel=channel,
            subject_template=subject_template,
            body_template=body_template,
            is_active=True,
        )
        self.session.add(template)
        await self.session.flush()
        return template

    async def get_template_by_code(self, code: str) -> Optional[NotificationTemplate]:
        stmt = select(NotificationTemplate).where(NotificationTemplate.code == code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_templates(self, is_active: Optional[bool] = None) -> List[NotificationTemplate]:
        stmt = select(NotificationTemplate)
        if is_active is not None:
            stmt = stmt.where(NotificationTemplate.is_active == is_active)
        stmt = stmt.order_by(NotificationTemplate.code)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_template(
        self,
        code: str,
        subject_template: Optional[str] = None,
        body_template: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[NotificationTemplate]:
        template = await self.get_template_by_code(code)
        if not template:
            return None
        if subject_template is not None:
            template.subject_template = subject_template
        if body_template is not None:
            template.body_template = body_template
        if is_active is not None:
            template.is_active = is_active
        await self.session.flush()
        return template

    # ---------------------------------------------------------------------------
    # Notification Jobs
    # ---------------------------------------------------------------------------

    async def create_job(
        self,
        notification_id: uuid.UUID,
        max_retries: int = 3,
    ) -> NotificationJob:
        job = NotificationJob(
            notification_id=notification_id,
            max_retries=max_retries,
            status=JobStatus.QUEUED,
        )
        self.session.add(job)
        notification = await self.session.get(Notification, notification_id)
        if notification and "jobs" in notification.__dict__:
            notification.jobs.append(job)
        await self.session.flush()
        return job

    async def get_job_by_id(self, job_id: uuid.UUID) -> Optional[NotificationJob]:
        stmt = select(NotificationJob).where(NotificationJob.id == job_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[NotificationJob], int]:
        conditions = []
        if status is not None:
            conditions.append(NotificationJob.status == status)

        count_stmt = select(func.count(NotificationJob.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(NotificationJob)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(NotificationJob.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total
