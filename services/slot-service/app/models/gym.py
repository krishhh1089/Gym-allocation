import uuid
from datetime import date, time
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, uuid_pk


class Gym(Base, TimestampMixin):
    """
    Campus gym facility (e.g., C. V. Raman, Ganga, Krishna, Narmada).
    """

    __tablename__ = "gyms"

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    eligibility_group: Mapped[str] = mapped_column(
        String(50), nullable=False, default="ALL"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships within the same database
    slots: Mapped[List["GymSlot"]] = relationship(
        back_populates="gym", cascade="all, delete-orphan", lazy="selectin"
    )
    trainer_assignments: Mapped[List["TrainerGymAssignment"]] = relationship(
        back_populates="gym", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("name", name="uq_gyms_name"),
        Index("ix_gyms_name", "name"),
        Index("ix_gyms_is_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Gym id={self.id} name={self.name} active={self.is_active}>"


class GymSlot(Base, TimestampMixin):
    """
    A time slot allocation container under a specific gym.
    Capacity represents the maximum concurrent students allowed.
    """

    __tablename__ = "gym_slots"

    id: Mapped[uuid.UUID] = uuid_pk()
    gym_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    gym: Mapped["Gym"] = relationship(back_populates="slots")
    schedules: Mapped[List["SlotSchedule"]] = relationship(
        back_populates="slot", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        CheckConstraint("capacity > 0", name="chk_gym_slots_capacity_positive"),
        Index("ix_gym_slots_gym_id", "gym_id"),
        Index("ix_gym_slots_is_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<GymSlot id={self.id} gym_id={self.gym_id} capacity={self.capacity}>"


class SlotSchedule(Base, TimestampMixin):
    """
    Day-of-week timing definition for a slot (e.g. MON-SAT 06:00 to 07:00).
    """

    __tablename__ = "slot_schedules"

    id: Mapped[uuid.UUID] = uuid_pk()
    slot_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("gym_slots.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # e.g., MONDAY, TUESDAY, ALL
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    effective_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    slot: Mapped["GymSlot"] = relationship(back_populates="schedules")

    __table_args__ = (
        CheckConstraint("start_time < end_time", name="chk_slot_schedule_time_range"),
        Index("ix_slot_schedules_slot_id", "slot_id"),
        Index("ix_slot_schedules_day_of_week", "day_of_week"),
    )

    def __repr__(self) -> str:
        return (
            f"<SlotSchedule id={self.id} slot={self.slot_id} "
            f"day={self.day_of_week} {self.start_time}-{self.end_time}>"
        )


class TrainerGymAssignment(Base, TimestampMixin):
    """
    Assigns a trainer (Identity Service user ID) to a gym facility.
    trainer_id is a logical reference to Identity Service — no cross-DB FK.
    """

    __tablename__ = "trainer_gym_assignments"

    id: Mapped[uuid.UUID] = uuid_pk()
    trainer_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    gym_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False
    )
    effective_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    gym: Mapped["Gym"] = relationship(back_populates="trainer_assignments")

    __table_args__ = (
        Index("ix_trainer_gym_assignments_trainer_id", "trainer_id"),
        Index("ix_trainer_gym_assignments_gym_id", "gym_id"),
    )

    def __repr__(self) -> str:
        return f"<TrainerGymAssignment trainer={self.trainer_id} gym={self.gym_id}>"
