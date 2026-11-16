import uuid
from datetime import date, datetime, time, timezone
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Time,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, uuid_pk


class RegistrationWindow(Base, TimestampMixin):
    """
    Time-bounded application period configured by sports administrators.
    """

    __tablename__ = "registration_windows"

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    opens_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closes_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    daily_open_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    daily_close_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    timezone: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Asia/Kolkata"
    )
    # UPCOMING | OPEN | CLOSED | PAUSED
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="UPCOMING")
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)

    # Relationships
    applications: Mapped[List["Application"]] = relationship(
        back_populates="registration_window", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        CheckConstraint("opens_at < closes_at", name="chk_reg_window_time_range"),
        Index("ix_registration_windows_status", "status"),
        Index("ix_registration_windows_opens_at", "opens_at"),
        Index("ix_registration_windows_closes_at", "closes_at"),
    )

    def is_currently_open(self, now_utc: datetime) -> bool:
        if self.status != "OPEN":
            return False

        opens_at = self.opens_at
        closes_at = self.closes_at
        # Normalise naive datetimes from SQLite
        if opens_at.tzinfo is None and now_utc.tzinfo is not None:
            opens_at = opens_at.replace(tzinfo=timezone.utc)
        if closes_at.tzinfo is None and now_utc.tzinfo is not None:
            closes_at = closes_at.replace(tzinfo=timezone.utc)
        if now_utc.tzinfo is None and opens_at.tzinfo is not None:
            now_utc = now_utc.replace(tzinfo=timezone.utc)

        if not (opens_at <= now_utc <= closes_at):
            return False
        if self.daily_open_time and self.daily_close_time:
            current_time = now_utc.time()
            if not (self.daily_open_time <= current_time <= self.daily_close_time):
                return False
        return True


class SlotCapacity(Base):
    """
    Local capacity tracking table for atomic allocation enforcement and FCFS waitlisting.
    """

    __tablename__ = "slot_capacities"

    slot_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    allocated_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    waitlisted_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint("max_capacity > 0", name="chk_slot_max_capacity_pos"),
        CheckConstraint("allocated_count >= 0", name="chk_slot_allocated_pos"),
        CheckConstraint("waitlisted_count >= 0", name="chk_slot_waitlisted_pos"),
    )


class Application(Base, TimestampMixin):
    """
    Student application for a gym slot.
    Priority is strictly determined by server-generated applied_at_utc,
    with priority_sequence as tie-breaker.
    """

    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    slot_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    registration_window_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("registration_windows.id", ondelete="CASCADE"), nullable=False
    )
    applied_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    priority_sequence: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0
    )
    # PENDING | APPROVED | REJECTED | WAITLISTED | OFFERED | WITHDRAWN | EXPIRED
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")

    registration_window: Mapped["RegistrationWindow"] = relationship(
        back_populates="applications"
    )

    __table_args__ = (
        Index("ix_applications_student_id", "student_id"),
        Index("ix_applications_slot_id", "slot_id"),
        Index("ix_applications_status", "status"),
        Index("ix_applications_priority", "applied_at_utc", "priority_sequence"),
    )


class Allocation(Base, TimestampMixin):
    """
    Active or historical gym slot allocation.
    """

    __tablename__ = "allocations"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    slot_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    application_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    # ACTIVE | TRANSFERRED | TERMINATED | EXPIRED
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    gym_card_tokens: Mapped[List["GymCardToken"]] = relationship(
        back_populates="allocation", cascade="all, delete-orphan", lazy="selectin"
    )
    transfer_requests: Mapped[List["SlotChangeRequest"]] = relationship(
        back_populates="current_allocation", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        CheckConstraint("start_date <= end_date", name="chk_allocation_dates"),
        Index("ix_allocations_student_id", "student_id"),
        Index("ix_allocations_slot_id", "slot_id"),
        Index("ix_allocations_status", "status"),
    )


class GymCardToken(Base):
    """
    Opaque short-lived QR token hash for attendance check-in.
    Never stores plaintext token.
    """

    __tablename__ = "gym_card_tokens"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    allocation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("allocations.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    allocation: Mapped["Allocation"] = relationship(back_populates="gym_card_tokens")

    __table_args__ = (
        Index("ix_gym_card_tokens_token_hash", "token_hash"),
        Index("ix_gym_card_tokens_student_id", "student_id"),
        Index("ix_gym_card_tokens_expires_at", "expires_at"),
    )


class SlotChangeRequest(Base, TimestampMixin):
    """
    Student request to transfer from an active slot to another.
    Crucial policy: active slot is not forfeited unless the request is approved.
    """

    __tablename__ = "slot_change_requests"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    current_allocation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("allocations.id", ondelete="CASCADE"), nullable=False
    )
    requested_slot_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    # PENDING | APPROVED | REJECTED | WITHDRAWN
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    current_allocation: Mapped["Allocation"] = relationship(
        back_populates="transfer_requests"
    )

    __table_args__ = (
        Index("ix_slot_change_requests_student_id", "student_id"),
        Index("ix_slot_change_requests_status", "status"),
        Index("ix_slot_change_requests_requested_slot_id", "requested_slot_id"),
    )
