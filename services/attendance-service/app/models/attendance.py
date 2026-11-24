import enum
import hashlib
import uuid
from datetime import date, datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, uuid_pk, utcnow


class SessionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    EXCUSED = "EXCUSED"
    INVALIDATED = "INVALIDATED"


class CheckInMethod(str, enum.Enum):
    QR_SCAN = "QR_SCAN"
    MANUAL_FALLBACK = "MANUAL_FALLBACK"


class AttendanceSession(TimestampMixin, Base):
    """
    Scheduled gym session for a given slot on a specific date.
    Slot schedule snapshot ensures verification stability even if slot timing changes later.
    """

    __tablename__ = "attendance_sessions"

    id: Mapped[uuid.UUID] = uuid_pk()
    # Logical reference to Slot Service slot_id (no cross-DB FK)
    slot_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    session_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, native_enum=False, length=32),
        default=SessionStatus.SCHEDULED,
        nullable=False,
        index=True,
    )

    # Relationships
    attendance_records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    exemptions: Mapped[List["AttendanceExemption"]] = relationship(
        "AttendanceExemption",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    tokens: Mapped[List["GymCardToken"]] = relationship(
        "GymCardToken",
        back_populates="session",
    )

    __table_args__ = (
        Index("ix_attendance_sessions_slot_date", "slot_id", "session_date"),
    )

    def is_check_in_open(self, now: datetime, before_min: int = 15, after_min: int = 30) -> bool:
        """Determines if the session check-in window is currently open."""
        if self.status != SessionStatus.SCHEDULED:
            return False
        # Normalize naive/aware for safety
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        starts = self.starts_at if self.starts_at.tzinfo else self.starts_at.replace(tzinfo=timezone.utc)
        ends = self.ends_at if self.ends_at.tzinfo else self.ends_at.replace(tzinfo=timezone.utc)

        from datetime import timedelta
        window_start = starts - timedelta(minutes=before_min)
        window_end = ends + timedelta(minutes=after_min)
        return window_start <= now <= window_end

    def is_late(self, now: datetime, late_grace_min: int = 15) -> bool:
        """Checks if a check-in is considered late (after session starts + grace period)."""
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        starts = self.starts_at if self.starts_at.tzinfo else self.starts_at.replace(tzinfo=timezone.utc)
        from datetime import timedelta
        return now > (starts + timedelta(minutes=late_grace_min))


class AttendanceRecord(TimestampMixin, Base):
    """
    Individual student attendance record for a scheduled session.
    UNIQUE(student_id, session_id) strictly prevents duplicate check-ins.
    """

    __tablename__ = "attendance"

    id: Mapped[uuid.UUID] = uuid_pk()
    # Logical references to other microservices
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    allocation_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)

    # Local FK to attendance_sessions
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("attendance_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus, native_enum=False, length=32),
        default=AttendanceStatus.PRESENT,
        nullable=False,
        index=True,
    )
    check_in_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    method: Mapped[Optional[CheckInMethod]] = mapped_column(
        Enum(CheckInMethod, native_enum=False, length=32),
        nullable=True,
    )
    # Logical reference to staff user_id
    staff_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True, index=True)

    # Relationships
    session: Mapped["AttendanceSession"] = relationship(
        "AttendanceSession",
        back_populates="attendance_records",
    )
    corrections: Mapped[List["AttendanceCorrection"]] = relationship(
        "AttendanceCorrection",
        back_populates="attendance",
        cascade="all, delete-orphan",
        order_by="AttendanceCorrection.corrected_at.desc()",
    )

    __table_args__ = (
        UniqueConstraint("student_id", "session_id", name="uq_attendance_student_session"),
        Index("ix_attendance_student_date", "student_id", "session_date"),
    )


class AttendanceCorrection(Base):
    """
    Audit log of manual corrections or invalidations to attendance records.
    Never delete or silently overwrite attendance rows.
    """

    __tablename__ = "attendance_corrections"

    id: Mapped[uuid.UUID] = uuid_pk()
    attendance_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("attendance.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Identity Service user ID who performed the correction
    corrected_by: Mapped[uuid.UUID] = mapped_column(nullable=False)
    old_status: Mapped[str] = mapped_column(String(32), nullable=False)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    # Relationships
    attendance: Mapped["AttendanceRecord"] = relationship(
        "AttendanceRecord",
        back_populates="corrections",
    )


class GymCardToken(Base):
    """
    Cryptographic hash of short-lived gym card QR tokens.
    Token is bound to student, allocation, and optional session.
    """

    __tablename__ = "gym_card_tokens"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    allocation_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("attendance_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    session: Mapped[Optional["AttendanceSession"]] = relationship(
        "AttendanceSession",
        back_populates="tokens",
    )

    @classmethod
    def hash_raw_token(cls, raw: str) -> str:
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def is_valid(self, now: Optional[datetime] = None) -> bool:
        if self.revoked_at is not None:
            return False
        if now is None:
            now = utcnow()
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        exp = self.expires_at if self.expires_at.tzinfo else self.expires_at.replace(tzinfo=timezone.utc)
        return now < exp


class AbsencePolicy(TimestampMixin, Base):
    """
    Configurable absence threshold policy.
    E.g. 4 consecutive unexcused absences triggers termination / warning.
    """

    __tablename__ = "absence_policies"

    id: Mapped[uuid.UUID] = uuid_pk()
    consecutive_absence_threshold: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    effective_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    updated_by: Mapped[uuid.UUID] = mapped_column(nullable=False)


class AttendanceExemption(Base):
    """
    Exemptions granted for medical leave, university events, or cancellations.
    Prevents absent markings from impacting absence thresholds.
    """

    __tablename__ = "attendance_exemptions"

    id: Mapped[uuid.UUID] = uuid_pk()
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("attendance_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    session: Mapped["AttendanceSession"] = relationship(
        "AttendanceSession",
        back_populates="exemptions",
    )

    __table_args__ = (
        UniqueConstraint("student_id", "session_id", name="uq_exemption_student_session"),
    )
