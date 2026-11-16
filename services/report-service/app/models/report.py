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


class ReportType(str, enum.Enum):
    ALLOCATION_ROSTER = "ALLOCATION_ROSTER"
    ATTENDANCE_SUMMARY = "ATTENDANCE_SUMMARY"
    CAPACITY_UTILIZATION = "CAPACITY_UTILIZATION"
    ABSENCE_ROSTER = "ABSENCE_ROSTER"
    AUDIT_LOG = "AUDIT_LOG"
    TRANSFER_HISTORY = "TRANSFER_HISTORY"
    CUSTOM = "CUSTOM"


class ReportFormat(str, enum.Enum):
    CSV = "CSV"
    JSON = "JSON"
    XLSX = "XLSX"


class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ReportJobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Report(TimestampMixin, Base):
    """
    Generated report metadata and file reference.
    Files are stored in object storage or local directory; PostgreSQL stores references only.
    """

    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, native_enum=False, length=32),
        default=ReportType.CUSTOM,
        nullable=False,
        index=True,
    )
    format: Mapped[ReportFormat] = mapped_column(
        Enum(ReportFormat, native_enum=False, length=16),
        default=ReportFormat.CSV,
        nullable=False,
    )
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, native_enum=False, length=16),
        default=ReportStatus.PENDING,
        nullable=False,
        index=True,
    )
    file_ref: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    parameters: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Logical reference to Identity Service user
    created_by: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    jobs: Mapped[List["ReportJob"]] = relationship(
        "ReportJob",
        back_populates="report",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_reports_type_status", "type", "status"),
    )


class ReportJob(TimestampMixin, Base):
    """
    Background worker job record tracking asynchronous report generation.
    """

    __tablename__ = "report_jobs"

    id: Mapped[uuid.UUID] = uuid_pk()
    report_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[ReportJobStatus] = mapped_column(
        Enum(ReportJobStatus, native_enum=False, length=16),
        default=ReportJobStatus.QUEUED,
        nullable=False,
        index=True,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    report: Mapped["Report"] = relationship(
        "Report",
        back_populates="jobs",
    )


class AuditLog(Base):
    """
    Centralized, append-only audit trail recording sensitive administrative operations across GymSlot.
    """

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = uuid_pk()
    # Logical reference to Identity user who acted
    actor_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    target_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    before_state: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    after_state: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
        index=True,
    )
