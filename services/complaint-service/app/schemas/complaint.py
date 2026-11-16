import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.complaint import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
    SupportCategory,
    SupportStatus,
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
# Complaint Comments
# ---------------------------------------------------------------------------

class ComplaintCommentCreate(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class ComplaintCommentResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    user_id: uuid.UUID
    comment: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Complaints
# ---------------------------------------------------------------------------

class ComplaintCreate(BaseModel):
    category: ComplaintCategory = ComplaintCategory.OTHER
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    priority: ComplaintPriority = ComplaintPriority.MEDIUM


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    resolution_notes: Optional[str] = None


class ComplaintAssign(BaseModel):
    assigned_to: uuid.UUID


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    submitted_by: uuid.UUID
    category: ComplaintCategory
    title: str
    description: str
    status: ComplaintStatus
    priority: ComplaintPriority
    assigned_to: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintDetailResponse(ComplaintResponse):
    comments: List[ComplaintCommentResponse] = []


class ComplaintListResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    size: int


# ---------------------------------------------------------------------------
# Support Requests
# ---------------------------------------------------------------------------

class SupportRequestCreate(BaseModel):
    category: SupportCategory = SupportCategory.OTHER
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)


class SupportRequestUpdate(BaseModel):
    status: Optional[SupportStatus] = None
    resolution: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None


class SupportRequestResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    category: SupportCategory
    title: str
    description: str
    status: SupportStatus
    assigned_to: Optional[uuid.UUID] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SupportRequestListResponse(BaseModel):
    items: List[SupportRequestResponse]
    total: int
    page: int
    size: int
