import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.report import (
    ReportFormat,
    ReportJobStatus,
    ReportStatus,
    ReportType,
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
# Reports
# ---------------------------------------------------------------------------

class ReportCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    type: ReportType = ReportType.ALLOCATION_ROSTER
    format: ReportFormat = ReportFormat.CSV
    parameters: Optional[Dict[str, Any]] = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: ReportType
    format: ReportFormat
    status: ReportStatus
    file_ref: Optional[str] = None
    parameters: Optional[str] = None
    created_by: uuid.UUID
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    page: int
    size: int


class ReportJobResponse(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    status: ReportJobStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------------

class AuditLogCreate(BaseModel):
    actor_id: uuid.UUID
    action: str = Field(..., min_length=2, max_length=64)
    target_type: str = Field(..., min_length=2, max_length=64)
    target_id: str = Field(..., min_length=1, max_length=128)
    before_state: Optional[str] = None
    after_state: Optional[str] = None
    reason: Optional[str] = None
    correlation_id: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID
    action: str
    target_type: str
    target_id: str
    before_state: Optional[str] = None
    after_state: Optional[str] = None
    reason: Optional[str] = None
    correlation_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    size: int


# ---------------------------------------------------------------------------
# Analytics Projections
# ---------------------------------------------------------------------------

class AnalyticsSummaryResponse(BaseModel):
    active_allocations: int
    today_attendance_count: int
    open_complaints_count: int
    overall_capacity_utilization: float
