import enum
import uuid
from typing import Optional

from sqlalchemy import Enum, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import TimestampMixin, uuid_pk


class AccountStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class Student(Base, TimestampMixin):
    """
    Student profile record.
    identity_user_id is a logical reference to the Identity Service user —
    no cross-database foreign key is used.
    """

    __tablename__ = "students"

    id: Mapped[uuid.UUID] = uuid_pk()

    # Logical reference to Identity Service — no FK constraint
    identity_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)

    registration_number: Mapped[str] = mapped_column(String(50), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    programme: Mapped[str] = mapped_column(String(100), nullable=False)
    academic_year: Mapped[int] = mapped_column(Integer, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    profile_photo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    account_status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, name="accountstatus"),
        nullable=False,
        default=AccountStatus.PENDING,
    )

    __table_args__ = (
        UniqueConstraint("registration_number", name="uq_students_registration_number"),
        UniqueConstraint("email", name="uq_students_email"),
        Index("ix_students_registration_number", "registration_number"),
        Index("ix_students_email", "email"),
        Index("ix_students_identity_user_id", "identity_user_id"),
        Index("ix_students_account_status", "account_status"),
    )

    def __repr__(self) -> str:
        return (
            f"<Student id={self.id} reg={self.registration_number} "
            f"email={self.email} status={self.account_status}>"
        )


class PhotoChangeRequest(Base, TimestampMixin):
    """
    Photo change request submitted by a student.
    Admin must review and approve before the new photo becomes active.
    """

    __tablename__ = "photo_change_requests"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    requested_photo_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    # PENDING | APPROVED | REJECTED
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    decision_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    decided_at: Mapped[Optional[str]] = mapped_column(nullable=True)

    __table_args__ = (
        Index("ix_photo_change_requests_student_id", "student_id"),
    )

    def __repr__(self) -> str:
        return f"<PhotoChangeRequest id={self.id} student={self.student_id} status={self.status}>"
