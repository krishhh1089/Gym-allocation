"""Initial schema for Attendance Service

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-11-16 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. attendance_sessions ───────────────────────────────────────────────
    op.create_table(
        "attendance_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slot_id", sa.Uuid(), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="SCHEDULED"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attendance_sessions_slot_id", "attendance_sessions", ["slot_id"])
    op.create_index("ix_attendance_sessions_session_date", "attendance_sessions", ["session_date"])
    op.create_index("ix_attendance_sessions_starts_at", "attendance_sessions", ["starts_at"])
    op.create_index("ix_attendance_sessions_ends_at", "attendance_sessions", ["ends_at"])
    op.create_index("ix_attendance_sessions_status", "attendance_sessions", ["status"])
    op.create_index("ix_attendance_sessions_slot_date", "attendance_sessions", ["slot_id", "session_date"])

    # ── 2. attendance ────────────────────────────────────────────────────────
    op.create_table(
        "attendance",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("student_id", sa.Uuid(), nullable=False),
        sa.Column("allocation_id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="PRESENT"),
        sa.Column("check_in_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("method", sa.String(length=32), nullable=True),
        sa.Column("staff_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["attendance_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id", "session_id", name="uq_attendance_student_session"),
    )
    op.create_index("ix_attendance_student_id", "attendance", ["student_id"])
    op.create_index("ix_attendance_allocation_id", "attendance", ["allocation_id"])
    op.create_index("ix_attendance_session_id", "attendance", ["session_id"])
    op.create_index("ix_attendance_session_date", "attendance", ["session_date"])
    op.create_index("ix_attendance_status", "attendance", ["status"])
    op.create_index("ix_attendance_staff_id", "attendance", ["staff_id"])
    op.create_index("ix_attendance_student_date", "attendance", ["student_id", "session_date"])

    # ── 3. attendance_corrections ────────────────────────────────────────────
    op.create_table(
        "attendance_corrections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("attendance_id", sa.Uuid(), nullable=False),
        sa.Column("corrected_by", sa.Uuid(), nullable=False),
        sa.Column("old_status", sa.String(length=32), nullable=False),
        sa.Column("new_status", sa.String(length=32), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("corrected_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["attendance_id"], ["attendance.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attendance_corrections_attendance_id", "attendance_corrections", ["attendance_id"])

    # ── 4. gym_card_tokens ───────────────────────────────────────────────────
    op.create_table(
        "gym_card_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("student_id", sa.Uuid(), nullable=False),
        sa.Column("allocation_id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=True),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["attendance_sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_gym_card_tokens_student_id", "gym_card_tokens", ["student_id"])
    op.create_index("ix_gym_card_tokens_allocation_id", "gym_card_tokens", ["allocation_id"])
    op.create_index("ix_gym_card_tokens_session_id", "gym_card_tokens", ["session_id"])
    op.create_index("ix_gym_card_tokens_token_hash", "gym_card_tokens", ["token_hash"])

    # ── 5. absence_policies ──────────────────────────────────────────────────
    op.create_table(
        "absence_policies",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("consecutive_absence_threshold", sa.Integer(), nullable=False, server_default="4"),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("updated_by", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_absence_policies_is_active", "absence_policies", ["is_active"])

    # ── 6. attendance_exemptions ─────────────────────────────────────────────
    op.create_table(
        "attendance_exemptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("student_id", sa.Uuid(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["attendance_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id", "session_id", name="uq_exemption_student_session"),
    )
    op.create_index("ix_attendance_exemptions_session_id", "attendance_exemptions", ["session_id"])
    op.create_index("ix_attendance_exemptions_student_id", "attendance_exemptions", ["student_id"])


def downgrade() -> None:
    op.drop_table("attendance_exemptions")
    op.drop_table("absence_policies")
    op.drop_table("gym_card_tokens")
    op.drop_table("attendance_corrections")
    op.drop_table("attendance")
    op.drop_table("attendance_sessions")
