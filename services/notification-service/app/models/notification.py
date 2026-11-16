import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, uuid_pk, utcnow


class NotificationType(str, enum.Enum):
    ALLOCATION_CONFIRMED = "ALLOCATION_CONFIRMED"
    WAITLIST_PROMOTED = "WAITLIST_PROMOTED"
    ABSENCE_WARNING = "ABSENCE_WARNING"
    TERMINATION_NOTICE = "TERMINATION_NOTICE"
    PHOTO_STATUS = "PHOTO_STATUS"
    TRANSFER_STATUS = "TRANSFER_STATUS"
    ANNOUNCEMENT = "ANNOUNCEMENT"
    GENERAL = "GENERAL"


class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"


class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"


class JobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    DEAD_LETTER = "DEAD_LETTER"


class Notification(TimestampMixin, Base):
    """
    Individual user notification record.
    `user_id` is an Identity Service user ID (logical reference).
    `deduplication_key` ensures idempotent delivery across retries.
    """

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, native_enum=False, length=32),
        default=NotificationType.GENERAL,
        nullable=False,
        index=True,
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, native_enum=False, length=16),
        default=NotificationChannel.IN_APP,
        nullable=False,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, native_enum=False, length=16),
        default=NotificationStatus.PENDING,
        nullable=False,
        index=True,
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deduplication_key: Mapped[Optional[str]] = mapped_column(
        String(128),
        unique=True,
        nullable=True,
        index=True,
    )

    # Relationships
    jobs: Mapped[List["NotificationJob"]] = relationship(
        "NotificationJob",
        back_populates="notification",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_notifications_user_status", "user_id", "status"),
    )


class NotificationTemplate(TimestampMixin, Base):
    """
    Reusable message templates with placeholders (e.g. {{student_name}}, {{slot_time}}).
    """

    __tablename__ = "notification_templates"

    id: Mapped[uuid.UUID] = uuid_pk()
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, native_enum=False, length=16),
        default=NotificationChannel.EMAIL,
        nullable=False,
    )
    subject_template: Mapped[str] = mapped_column(String(255), nullable=False)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)


class Announcement(TimestampMixin, Base):
    """
    Public or role-targeted announcements posted by sports administrators.
    """

    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    target_role: Mapped[str] = mapped_column(String(32), default="ALL", nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)


class NotificationJob(TimestampMixin, Base):
    """
    Durable queue item for notification dispatching with retry logic and dead-lettering.
    """

    __tablename__ = "notification_jobs"

    id: Mapped[uuid.UUID] = uuid_pk()
    notification_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("notifications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    next_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, native_enum=False, length=16),
        default=JobStatus.QUEUED,
        nullable=False,
        index=True,
    )

    # Relationships
    notification: Mapped["Notification"] = relationship(
        "Notification",
        back_populates="jobs",
    )
