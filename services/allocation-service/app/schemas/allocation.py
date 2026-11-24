import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ── Registration Window Schemas ───────────────────────────────────────────────

class RegistrationWindowBase(BaseModel):
    name: str
    opens_at: datetime
    closes_at: datetime
    daily_open_time: Optional[time] = None
    daily_close_time: Optional[time] = None
    timezone: str = "Asia/Kolkata"
    status: str = "UPCOMING"

    @field_validator("closes_at")
    @classmethod
    def validate_window_dates(cls, closes_at: datetime, info) -> datetime:
        opens_at = info.data.get("opens_at")
        if opens_at and closes_at <= opens_at:
            raise ValueError("closes_at must be strictly after opens_at")
        return closes_at

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"UPCOMING", "OPEN", "CLOSED", "PAUSED"}
        v_upper = v.upper()
        if v_upper not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v_upper


class RegistrationWindowCreate(RegistrationWindowBase):
    pass


class RegistrationWindowUpdate(BaseModel):
    name: Optional[str] = None
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    daily_open_time: Optional[time] = None
    daily_close_time: Optional[time] = None
    timezone: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"UPCOMING", "OPEN", "CLOSED", "PAUSED"}
            v_upper = v.upper()
            if v_upper not in allowed:
                raise ValueError(f"status must be one of {allowed}")
            return v_upper
        return v


class RegistrationWindowResponse(RegistrationWindowBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


class RegistrationWindowListResponse(BaseModel):
    items: List[RegistrationWindowResponse]
    total: int
    skip: int
    limit: int


# ── Slot Capacity Schemas ─────────────────────────────────────────────────────

class SlotCapacitySet(BaseModel):
    slot_id: uuid.UUID
    max_capacity: int

    @field_validator("max_capacity")
    @classmethod
    def validate_max_capacity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("max_capacity must be greater than zero")
        return v


class SlotCapacityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slot_id: uuid.UUID
    max_capacity: int
    allocated_count: int
    waitlisted_count: int
    updated_at: datetime


# ── Application Schemas ───────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    slot_id: uuid.UUID
    registration_window_id: uuid.UUID


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    slot_id: uuid.UUID
    registration_window_id: uuid.UUID
    applied_at_utc: datetime
    priority_sequence: int
    status: str
    created_at: datetime
    updated_at: datetime


class ApplicationListResponse(BaseModel):
    items: List[ApplicationResponse]
    total: int
    skip: int
    limit: int


class WaitlistPositionResponse(BaseModel):
    application_id: uuid.UUID
    slot_id: uuid.UUID
    status: str
    waitlist_position: Optional[int] = None
    total_waitlisted: int


# ── Allocation Schemas ────────────────────────────────────────────────────────

class AllocationCreateManual(BaseModel):
    student_id: uuid.UUID
    slot_id: uuid.UUID
    start_date: date
    end_date: date


class AllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    slot_id: uuid.UUID
    application_id: Optional[uuid.UUID] = None
    status: str
    start_date: date
    end_date: date
    created_at: datetime
    updated_at: datetime


class AllocationListResponse(BaseModel):
    items: List[AllocationResponse]
    total: int
    skip: int
    limit: int


# ── Gym Card / Token Schemas ──────────────────────────────────────────────────

class GymCardTokenResponse(BaseModel):
    token: str  # Plaintext token returned ONLY once upon generation
    token_hash: str
    expires_at: datetime
    allocation_id: uuid.UUID
    student_id: uuid.UUID


class GymCardVerifyRequest(BaseModel):
    token: str


class GymCardVerifyResponse(BaseModel):
    is_valid: bool
    student_id: Optional[uuid.UUID] = None
    allocation_id: Optional[uuid.UUID] = None
    slot_id: Optional[uuid.UUID] = None
    message: str


# ── Slot Change / Transfer Schemas ────────────────────────────────────────────

class SlotChangeRequestCreate(BaseModel):
    current_allocation_id: uuid.UUID
    requested_slot_id: uuid.UUID
    reason: Optional[str] = None


class SlotChangeRequestReview(BaseModel):
    action: str  # APPROVE or REJECT

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in {"APPROVE", "REJECT"}:
            raise ValueError("action must be APPROVE or REJECT")
        return v_upper


class SlotChangeRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    current_allocation_id: uuid.UUID
    requested_slot_id: uuid.UUID
    status: str
    reason: Optional[str] = None
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class SlotChangeRequestListResponse(BaseModel):
    items: List[SlotChangeRequestResponse]
    total: int
    skip: int
    limit: int


# ── Current User ──────────────────────────────────────────────────────────────

class CurrentUser(BaseModel):
    user_id: uuid.UUID
    email: str
    roles: List[str]
    status: str
