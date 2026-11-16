import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.notification import (
    JobStatus,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
)


# ---------------------------------------------------------------------------
# Auth / Identity Schemas
# ---------------------------------------------------------------------------

class CurrentUser(BaseModel):
    user_id: uuid.UUID
    email: str
    roles: List[str]
    status: str = "ACTIVE"


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    type: NotificationType = NotificationType.GENERAL
    channel: NotificationChannel = NotificationChannel.IN_APP
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    deduplication_key: Optional[str] = Field(None, max_length=128)


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    channel: NotificationChannel
    subject: str
    message: str
    status: NotificationStatus
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    deduplication_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    size: int


# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    target_role: str = Field(default="ALL", max_length=32)
    send_notification: bool = False


class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    target_role: str
    author_id: uuid.UUID
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Notification Templates
# ---------------------------------------------------------------------------

class NotificationTemplateCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=64)
    channel: NotificationChannel = NotificationChannel.EMAIL
    subject_template: str = Field(..., min_length=1, max_length=255)
    body_template: str = Field(..., min_length=1)


class NotificationTemplateUpdate(BaseModel):
    subject_template: Optional[str] = Field(None, max_length=255)
    body_template: Optional[str] = None
    is_active: Optional[bool] = None


class NotificationTemplateResponse(BaseModel):
    id: uuid.UUID
    code: str
    channel: NotificationChannel
    subject_template: str
    body_template: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Notification Jobs
# ---------------------------------------------------------------------------

class JobResponse(BaseModel):
    id: uuid.UUID
    notification_id: uuid.UUID
    retry_count: int
    max_retries: int
    next_attempt_at: datetime
    error_message: Optional[str] = None
    status: JobStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
