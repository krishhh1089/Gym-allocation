"""Initial schema for Student Service: students, photo_change_requests

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-11-15 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Table: students ───────────────────────────────────────────────────────
    op.create_table(
        'students',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('identity_user_id', sa.UUID(), nullable=True),
        sa.Column('registration_number', sa.String(length=50), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('programme', sa.String(length=100), nullable=False),
        sa.Column('academic_year', sa.Integer(), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('profile_photo_url', sa.String(length=1024), nullable=True),
        sa.Column(
            'account_status',
            sa.Enum('PENDING', 'ACTIVE', 'SUSPENDED', name='accountstatus'),
            nullable=False,
            server_default='PENDING',
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('registration_number', name='uq_students_registration_number'),
        sa.UniqueConstraint('email', name='uq_students_email'),
    )
    op.create_index('ix_students_registration_number', 'students', ['registration_number'])
    op.create_index('ix_students_email', 'students', ['email'])
    op.create_index('ix_students_identity_user_id', 'students', ['identity_user_id'])
    op.create_index('ix_students_account_status', 'students', ['account_status'])

    # ── Table: photo_change_requests ──────────────────────────────────────────
    op.create_table(
        'photo_change_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('requested_photo_url', sa.String(length=1024), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('reviewed_by', sa.UUID(), nullable=True),
        sa.Column('decision_reason', sa.String(length=500), nullable=True),
        sa.Column('decided_at', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_photo_change_requests_student_id', 'photo_change_requests', ['student_id'])


def downgrade() -> None:
    op.drop_index('ix_photo_change_requests_student_id', table_name='photo_change_requests')
    op.drop_table('photo_change_requests')
    op.drop_index('ix_students_account_status', table_name='students')
    op.drop_index('ix_students_identity_user_id', table_name='students')
    op.drop_index('ix_students_email', table_name='students')
    op.drop_index('ix_students_registration_number', table_name='students')
    op.drop_table('students')
    # Drop enum type (PostgreSQL only)
    sa.Enum(name='accountstatus').drop(op.get_bind(), checkfirst=True)
