"""Initial schema for Complaint Service

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-11-16 22:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. complaints ────────────────────────────────────────────────────────
    op.create_table(
        "complaints",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("student_id", sa.Uuid(), nullable=False),
        sa.Column("submitted_by", sa.Uuid(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False, server_default="OTHER"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="OPEN"),
        sa.Column("priority", sa.String(length=16), nullable=False, server_default="MEDIUM"),
        sa.Column("assigned_to", sa.Uuid(), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_complaints_student_id", "complaints", ["student_id"])
    op.create_index("ix_complaints_submitted_by", "complaints", ["submitted_by"])
    op.create_index("ix_complaints_category", "complaints", ["category"])
    op.create_index("ix_complaints_status", "complaints", ["status"])
    op.create_index("ix_complaints_priority", "complaints", ["priority"])
    op.create_index("ix_complaints_assigned_to", "complaints", ["assigned_to"])
    op.create_index("ix_complaints_student_status", "complaints", ["student_id", "status"])

    # ── 2. complaint_comments ────────────────────────────────────────────────
    op.create_table(
        "complaint_comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("complaint_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_complaint_comments_complaint_id", "complaint_comments", ["complaint_id"])

    # ── 3. support_requests ──────────────────────────────────────────────────
    op.create_table(
        "support_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("student_id", sa.Uuid(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False, server_default="OTHER"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="OPEN"),
        sa.Column("assigned_to", sa.Uuid(), nullable=True),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_support_requests_student_id", "support_requests", ["student_id"])
    op.create_index("ix_support_requests_category", "support_requests", ["category"])
    op.create_index("ix_support_requests_status", "support_requests", ["status"])
    op.create_index("ix_support_requests_assigned_to", "support_requests", ["assigned_to"])
    op.create_index("ix_support_requests_student_status", "support_requests", ["student_id", "status"])


def downgrade() -> None:
    op.drop_table("support_requests")
    op.drop_table("complaint_comments")
    op.drop_table("complaints")
