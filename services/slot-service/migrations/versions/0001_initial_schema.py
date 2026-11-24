"""Initial schema for Slot Service: gyms, gym_slots, slot_schedules, trainer_gym_assignments

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-11-16 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Table: gyms ───────────────────────────────────────────────────────────
    op.create_table(
        'gyms',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('eligibility_group', sa.String(length=50), server_default='ALL', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', name='uq_gyms_name'),
    )
    op.create_index('ix_gyms_name', 'gyms', ['name'])
    op.create_index('ix_gyms_is_active', 'gyms', ['is_active'])

    # ── Table: gym_slots ──────────────────────────────────────────────────────
    op.create_table(
        'gym_slots',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('gym_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('capacity > 0', name='chk_gym_slots_capacity_positive'),
        sa.ForeignKeyConstraint(['gym_id'], ['gyms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_gym_slots_gym_id', 'gym_slots', ['gym_id'])
    op.create_index('ix_gym_slots_is_active', 'gym_slots', ['is_active'])

    # ── Table: slot_schedules ─────────────────────────────────────────────────
    op.create_table(
        'slot_schedules',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('slot_id', sa.UUID(), nullable=False),
        sa.Column('day_of_week', sa.String(length=20), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('effective_from', sa.Date(), nullable=True),
        sa.Column('effective_until', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('start_time < end_time', name='chk_slot_schedule_time_range'),
        sa.ForeignKeyConstraint(['slot_id'], ['gym_slots.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_slot_schedules_slot_id', 'slot_schedules', ['slot_id'])
    op.create_index('ix_slot_schedules_day_of_week', 'slot_schedules', ['day_of_week'])

    # ── Table: trainer_gym_assignments ────────────────────────────────────────
    op.create_table(
        'trainer_gym_assignments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trainer_id', sa.UUID(), nullable=False),
        sa.Column('gym_id', sa.UUID(), nullable=False),
        sa.Column('effective_from', sa.Date(), nullable=True),
        sa.Column('effective_until', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['gym_id'], ['gyms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_trainer_gym_assignments_trainer_id', 'trainer_gym_assignments', ['trainer_id'])
    op.create_index('ix_trainer_gym_assignments_gym_id', 'trainer_gym_assignments', ['gym_id'])


def downgrade() -> None:
    op.drop_table('trainer_gym_assignments')
    op.drop_table('slot_schedules')
    op.drop_table('gym_slots')
    op.drop_table('gyms')
