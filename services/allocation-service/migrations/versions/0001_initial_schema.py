"""Initial schema for Allocation Service: registration_windows, slot_capacities, applications, allocations, gym_card_tokens, slot_change_requests

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-11-16 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Table: registration_windows ───────────────────────────────────────────
    op.create_table(
        'registration_windows',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('opens_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('closes_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('daily_open_time', sa.Time(), nullable=True),
        sa.Column('daily_close_time', sa.Time(), nullable=True),
        sa.Column('timezone', sa.String(length=50), server_default='Asia/Kolkata', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='UPCOMING', nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('opens_at < closes_at', name='chk_reg_window_time_range'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_registration_windows_status', 'registration_windows', ['status'])
    op.create_index('ix_registration_windows_opens_at', 'registration_windows', ['opens_at'])
    op.create_index('ix_registration_windows_closes_at', 'registration_windows', ['closes_at'])

    # ── Table: slot_capacities ────────────────────────────────────────────────
    op.create_table(
        'slot_capacities',
        sa.Column('slot_id', sa.UUID(), nullable=False),
        sa.Column('max_capacity', sa.Integer(), nullable=False),
        sa.Column('allocated_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('waitlisted_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('max_capacity > 0', name='chk_slot_max_capacity_pos'),
        sa.CheckConstraint('allocated_count >= 0', name='chk_slot_allocated_pos'),
        sa.CheckConstraint('waitlisted_count >= 0', name='chk_slot_waitlisted_pos'),
        sa.PrimaryKeyConstraint('slot_id'),
    )

    # ── Table: applications ───────────────────────────────────────────────────
    op.create_table(
        'applications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('slot_id', sa.UUID(), nullable=False),
        sa.Column('registration_window_id', sa.UUID(), nullable=False),
        sa.Column('applied_at_utc', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('priority_sequence', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['registration_window_id'], ['registration_windows.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_applications_student_id', 'applications', ['student_id'])
    op.create_index('ix_applications_slot_id', 'applications', ['slot_id'])
    op.create_index('ix_applications_status', 'applications', ['status'])
    op.create_index('ix_applications_priority', 'applications', ['applied_at_utc', 'priority_sequence'])

    # ── Table: allocations ────────────────────────────────────────────────────
    op.create_table(
        'allocations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('slot_id', sa.UUID(), nullable=False),
        sa.Column('application_id', sa.UUID(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='ACTIVE', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('start_date <= end_date', name='chk_allocation_dates'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_allocations_student_id', 'allocations', ['student_id'])
    op.create_index('ix_allocations_slot_id', 'allocations', ['slot_id'])
    op.create_index('ix_allocations_status', 'allocations', ['status'])

    # ── Table: gym_card_tokens ────────────────────────────────────────────────
    op.create_table(
        'gym_card_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('allocation_id', sa.UUID(), nullable=False),
        sa.Column('session_id', sa.UUID(), nullable=True),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['allocation_id'], ['allocations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash', name='uq_gym_card_tokens_token_hash'),
    )
    op.create_index('ix_gym_card_tokens_token_hash', 'gym_card_tokens', ['token_hash'])
    op.create_index('ix_gym_card_tokens_student_id', 'gym_card_tokens', ['student_id'])
    op.create_index('ix_gym_card_tokens_expires_at', 'gym_card_tokens', ['expires_at'])

    # ── Table: slot_change_requests ───────────────────────────────────────────
    op.create_table(
        'slot_change_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('current_allocation_id', sa.UUID(), nullable=False),
        sa.Column('requested_slot_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('reviewed_by', sa.UUID(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['current_allocation_id'], ['allocations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_slot_change_requests_student_id', 'slot_change_requests', ['student_id'])
    op.create_index('ix_slot_change_requests_status', 'slot_change_requests', ['status'])
    op.create_index('ix_slot_change_requests_requested_slot_id', 'slot_change_requests', ['requested_slot_id'])


def downgrade() -> None:
    op.drop_table('slot_change_requests')
    op.drop_table('gym_card_tokens')
    op.drop_table('allocations')
    op.drop_table('applications')
    op.drop_table('slot_capacities')
    op.drop_table('registration_windows')
