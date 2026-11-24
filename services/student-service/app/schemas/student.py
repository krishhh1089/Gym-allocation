import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.student import AccountStatus


# ── Base schema ───────────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    registration_number: str
    full_name: str
    email: EmailStr
    department: str
    programme: str
    academic_year: int
    semester: int
    phone_number: Optional[str] = None
    profile_photo_url: Optional[str] = None


# ── Create / Update schemas ───────────────────────────────────────────────────

class StudentCreate(StudentBase):
    """Fields an admin provides when provisioning a student."""
    identity_user_id: Optional[uuid.UUID] = None
    account_status: AccountStatus = AccountStatus.PENDING

    @field_validator("academic_year")
    @classmethod
    def validate_academic_year(cls, v: int) -> int:
        if v < 1 or v > 6:
            raise ValueError("academic_year must be between 1 and 6")
        return v

    @field_validator("semester")
    @classmethod
    def validate_semester(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("semester must be between 1 and 12")
        return v


class StudentUpdate(BaseModel):
    """Fields a student can update on their own profile (limited set)."""
    phone_number: Optional[str] = None
    profile_photo_url: Optional[str] = None


class StudentAdminUpdate(BaseModel):
    """Fields admins can update (broader set)."""
    full_name: Optional[str] = None
    department: Optional[str] = None
    programme: Optional[str] = None
    academic_year: Optional[int] = None
    semester: Optional[int] = None
    phone_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    identity_user_id: Optional[uuid.UUID] = None

    @field_validator("academic_year")
    @classmethod
    def validate_academic_year(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 6):
            raise ValueError("academic_year must be between 1 and 6")
        return v

    @field_validator("semester")
    @classmethod
    def validate_semester(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 12):
            raise ValueError("semester must be between 1 and 12")
        return v


class StudentStatusUpdate(BaseModel):
    """Update only the account_status field (admin only)."""
    account_status: AccountStatus

    @field_validator("account_status")
    @classmethod
    def validate_status(cls, v: AccountStatus) -> AccountStatus:
        allowed = {AccountStatus.PENDING, AccountStatus.ACTIVE, AccountStatus.SUSPENDED}
        if v not in allowed:
            raise ValueError(f"status must be one of {[s.value for s in allowed]}")
        return v


# ── Response schemas ──────────────────────────────────────────────────────────

class StudentResponse(BaseModel):
    """Full response model for a student."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    identity_user_id: Optional[uuid.UUID] = None
    registration_number: str
    full_name: str
    email: str
    department: str
    programme: str
    academic_year: int
    semester: int
    phone_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    account_status: AccountStatus
    created_at: datetime
    updated_at: datetime


class StudentListResponse(BaseModel):
    """Paginated response wrapper for a list of students."""
    items: List[StudentResponse]
    total: int
    skip: int
    limit: int


# ── Current user schemas (from JWT) ───────────────────────────────────────────

class CurrentUser(BaseModel):
    """Decoded JWT payload available to downstream handlers."""
    user_id: uuid.UUID
    email: str
    roles: List[str]
    status: str
