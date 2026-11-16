import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.attendance import (
    AttendanceStatus,
    CheckInMethod,
    SessionStatus,
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
# Attendance Sessions
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    slot_id: uuid.UUID
    session_date: date
    starts_at: datetime
    ends_at: datetime


class SessionStatusUpdate(BaseModel):
    status: SessionStatus


class SessionResponse(BaseModel):
    id: uuid.UUID
    slot_id: uuid.UUID
    session_date: date
    starts_at: datetime
    ends_at: datetime
    status: SessionStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionListResponse(BaseModel):
    items: List[SessionResponse]
    total: int
    page: int
    size: int


# ---------------------------------------------------------------------------
# Attendance Records & Scanning
# ---------------------------------------------------------------------------

class AttendanceScanRequest(BaseModel):
    raw_token: str
    session_id: uuid.UUID
    student_id: uuid.UUID
    allocation_id: uuid.UUID


class AttendanceManualRequest(BaseModel):
    session_id: uuid.UUID
    student_id: uuid.UUID
    allocation_id: uuid.UUID
    status: AttendanceStatus = AttendanceStatus.PRESENT
    reason: Optional[str] = None


class AttendanceCorrectionCreate(BaseModel):
    new_status: AttendanceStatus
    reason: str = Field(..., min_length=3, max_length=500)


class AttendanceCorrectionResponse(BaseModel):
    id: uuid.UUID
    attendance_id: uuid.UUID
    corrected_by: uuid.UUID
    old_status: str
    new_status: str
    reason: str
    corrected_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceRecordResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    allocation_id: uuid.UUID
    session_id: uuid.UUID
    session_date: date
    status: AttendanceStatus
    check_in_time: Optional[datetime] = None
    method: Optional[CheckInMethod] = None
    staff_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceRecordDetailResponse(AttendanceRecordResponse):
    corrections: List[AttendanceCorrectionResponse] = []


class AttendanceListResponse(BaseModel):
    items: List[AttendanceRecordResponse]
    total: int
    page: int
    size: int


class ScanOutcomeResponse(BaseModel):
    outcome: str
    message: str
    attendance: Optional[AttendanceRecordResponse] = None


# ---------------------------------------------------------------------------
# Student Attendance Summary & Statistics
# ---------------------------------------------------------------------------

class AttendanceSummaryResponse(BaseModel):
    student_id: uuid.UUID
    total_sessions: int
    present_count: int
    late_count: int
    absent_count: int
    excused_count: int
    attendance_percentage: float
    consecutive_absences: int


# ---------------------------------------------------------------------------
# Exemptions
# ---------------------------------------------------------------------------

class ExemptionCreate(BaseModel):
    session_id: uuid.UUID
    student_id: uuid.UUID
    reason: str = Field(..., min_length=3, max_length=500)


class ExemptionResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID
    reason: str
    created_by: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Absence Policy & Monitoring
# ---------------------------------------------------------------------------

class AbsencePolicyUpdate(BaseModel):
    consecutive_absence_threshold: int = Field(default=4, ge=1, le=20)


class AbsencePolicyResponse(BaseModel):
    id: uuid.UUID
    consecutive_absence_threshold: int
    effective_from: datetime
    effective_until: Optional[datetime] = None
    is_active: bool
    updated_by: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AbsenceCandidateResponse(BaseModel):
    student_id: uuid.UUID
    consecutive_absences: int
    last_attended_date: Optional[date] = None
    status: str  # "WARNING" or "TERMINATION_CANDIDATE"


# ---------------------------------------------------------------------------
# Gym Card Token Registration (for sync/validation)
# ---------------------------------------------------------------------------

class GymCardTokenRegisterRequest(BaseModel):
    student_id: uuid.UUID
    allocation_id: uuid.UUID
    token_hash: str
    expires_at: datetime
    session_id: Optional[uuid.UUID] = None


class GymCardTokenResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    allocation_id: uuid.UUID
    token_hash: str
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
