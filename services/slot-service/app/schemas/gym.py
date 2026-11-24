import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ── Schedule schemas ──────────────────────────────────────────────────────────

class SlotScheduleBase(BaseModel):
    day_of_week: str  # e.g., MONDAY, TUESDAY, ALL
    start_time: time
    end_time: time
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None

    @field_validator("end_time")
    @classmethod
    def validate_times(cls, end: time, info) -> time:
        start = info.data.get("start_time")
        if start and end <= start:
            raise ValueError("end_time must be strictly after start_time")
        return end


class SlotScheduleCreate(SlotScheduleBase):
    pass


class SlotScheduleResponse(SlotScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slot_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ── GymSlot schemas ───────────────────────────────────────────────────────────

class GymSlotBase(BaseModel):
    name: Optional[str] = None
    capacity: int
    is_active: bool = True

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("capacity must be a positive integer greater than zero")
        return v


class GymSlotCreate(GymSlotBase):
    gym_id: uuid.UUID
    schedules: Optional[List[SlotScheduleCreate]] = None


class GymSlotUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("capacity must be a positive integer greater than zero")
        return v


class GymSlotResponse(GymSlotBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gym_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    schedules: List[SlotScheduleResponse] = []


class GymSlotListResponse(BaseModel):
    items: List[GymSlotResponse]
    total: int
    skip: int
    limit: int


# ── Gym schemas ───────────────────────────────────────────────────────────────

class GymBase(BaseModel):
    name: str
    location: str
    eligibility_group: str = "ALL"
    is_active: bool = True


class GymCreate(GymBase):
    pass


class GymUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    eligibility_group: Optional[str] = None
    is_active: Optional[bool] = None


class GymResponse(GymBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    slots: List[GymSlotResponse] = []


class GymListResponse(BaseModel):
    items: List[GymResponse]
    total: int
    skip: int
    limit: int


# ── Trainer Assignment schemas ────────────────────────────────────────────────

class TrainerAssignmentCreate(BaseModel):
    trainer_id: uuid.UUID
    gym_id: uuid.UUID
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None


class TrainerAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trainer_id: uuid.UUID
    gym_id: uuid.UUID
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    created_at: datetime


class TrainerAssignmentListResponse(BaseModel):
    items: List[TrainerAssignmentResponse]
    total: int


# ── Current User schema ───────────────────────────────────────────────────────

class CurrentUser(BaseModel):
    user_id: uuid.UUID
    email: str
    roles: List[str]
    status: str
