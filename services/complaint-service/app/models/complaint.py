import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, uuid_pk, utcnow


class ComplaintCategory(str, enum.Enum):
    EQUIPMENT = "EQUIPMENT"
    FACILITY = "FACILITY"
    TRAINER = "TRAINER"
    CLEANLINESS = "CLEANLINESS"
    SLOT_TIMING = "SLOT_TIMING"
    OTHER = "OTHER"


class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


class ComplaintPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class SupportCategory(str, enum.Enum):
    ALLOCATION = "ALLOCATION"
    ATTENDANCE = "ATTENDANCE"
    LOGIN = "LOGIN"
    OTHER = "OTHER"


class SupportStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Complaint(TimestampMixin, Base):
    """
    Formal student or staff complaint regarding gym facilities, equipment, staff, or operations.
    """

    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = uuid_pk()
    # Logical reference to Student Service or Identity Service user
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    submitted_by: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    category: Mapped[ComplaintCategory] = mapped_column(
        Enum(ComplaintCategory, native_enum=False, length=32),
        default=ComplaintCategory.OTHER,
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus, native_enum=False, length=32),
        default=ComplaintStatus.OPEN,
        nullable=False,
        index=True,
    )
    priority: Mapped[ComplaintPriority] = mapped_column(
        Enum(ComplaintPriority, native_enum=False, length=16),
        default=ComplaintPriority.MEDIUM,
        nullable=False,
        index=True,
    )
    # Logical reference to Identity Service staff user
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True, index=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    comments: Mapped[List["ComplaintComment"]] = relationship(
        "ComplaintComment",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="ComplaintComment.created_at.asc()",
    )

    __table_args__ = (
        Index("ix_complaints_student_status", "student_id", "status"),
    )


class ComplaintComment(Base):
    """
    Threaded notes, communications, or updates attached to a complaint.
    """

    __tablename__ = "complaint_comments"

    id: Mapped[uuid.UUID] = uuid_pk()
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Logical reference to user who posted comment
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    # Relationships
    complaint: Mapped["Complaint"] = relationship(
        "Complaint",
        back_populates="comments",
    )


class SupportRequest(TimestampMixin, Base):
    """
    In-app student help ticket for operational issues (e.g. incorrect allocation, missing attendance).
    """

    __tablename__ = "support_requests"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    category: Mapped[SupportCategory] = mapped_column(
        Enum(SupportCategory, native_enum=False, length=32),
        default=SupportCategory.OTHER,
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SupportStatus] = mapped_column(
        Enum(SupportStatus, native_enum=False, length=32),
        default=SupportStatus.OPEN,
        nullable=False,
        index=True,
    )
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True, index=True)
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_support_requests_student_status", "student_id", "status"),
    )
