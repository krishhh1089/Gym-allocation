"""
Repository layer for Gyms, GymSlots, SlotSchedules, and TrainerGymAssignments.
Isolates all SQLAlchemy queries.
"""

import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gym import Gym, GymSlot, SlotSchedule, TrainerGymAssignment


class SlotRepository:

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Gym Operations ────────────────────────────────────────────────────────

    async def create_gym(self, gym: Gym) -> Gym:
        self._session.add(gym)
        await self._session.flush()
        await self._session.refresh(gym)
        return gym

    async def get_gym_by_id(self, gym_id: uuid.UUID) -> Optional[Gym]:
        result = await self._session.execute(select(Gym).where(Gym.id == gym_id))
        return result.scalar_one_or_none()

    async def get_gym_by_name(self, name: str) -> Optional[Gym]:
        result = await self._session.execute(
            select(Gym).where(func.lower(Gym.name) == name.lower().strip())
        )
        return result.scalar_one_or_none()

    async def list_gyms(
        self,
        skip: int = 0,
        limit: int = 20,
        is_active: Optional[bool] = None,
    ) -> tuple[list[Gym], int]:
        base_query = select(Gym)
        if is_active is not None:
            base_query = base_query.where(Gym.is_active == is_active)

        count_result = await self._session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self._session.execute(
            base_query.order_by(Gym.created_at.desc()).offset(skip).limit(limit)
        )
        gyms = list(result.scalars().all())
        return gyms, total

    async def update_gym(self, gym_id: uuid.UUID, update_data: dict) -> Optional[Gym]:
        gym = await self.get_gym_by_id(gym_id)
        if gym is None:
            return None
        for key, value in update_data.items():
            if hasattr(gym, key) and value is not None:
                setattr(gym, key, value)
        self._session.add(gym)
        await self._session.flush()
        await self._session.refresh(gym)
        return gym

    # ── GymSlot Operations ────────────────────────────────────────────────────

    async def create_slot(self, slot: GymSlot) -> GymSlot:
        self._session.add(slot)
        await self._session.flush()
        await self._session.refresh(slot)
        return slot

    async def get_slot_by_id(self, slot_id: uuid.UUID) -> Optional[GymSlot]:
        result = await self._session.execute(
            select(GymSlot).where(GymSlot.id == slot_id)
        )
        return result.scalar_one_or_none()

    async def list_slots(
        self,
        skip: int = 0,
        limit: int = 20,
        gym_id: Optional[uuid.UUID] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[GymSlot], int]:
        base_query = select(GymSlot)
        if gym_id is not None:
            base_query = base_query.where(GymSlot.gym_id == gym_id)
        if is_active is not None:
            base_query = base_query.where(GymSlot.is_active == is_active)

        count_result = await self._session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self._session.execute(
            base_query.order_by(GymSlot.created_at.desc()).offset(skip).limit(limit)
        )
        slots = list(result.scalars().all())
        return slots, total

    async def update_slot(
        self, slot_id: uuid.UUID, update_data: dict
    ) -> Optional[GymSlot]:
        slot = await self.get_slot_by_id(slot_id)
        if slot is None:
            return None
        for key, value in update_data.items():
            if hasattr(slot, key) and value is not None:
                setattr(slot, key, value)
        self._session.add(slot)
        await self._session.flush()
        await self._session.refresh(slot)
        return slot

    async def delete_slot(self, slot_id: uuid.UUID) -> bool:
        slot = await self.get_slot_by_id(slot_id)
        if slot is None:
            return False
        await self._session.delete(slot)
        await self._session.flush()
        return True

    # ── SlotSchedule Operations ───────────────────────────────────────────────

    async def create_schedule(self, schedule: SlotSchedule) -> SlotSchedule:
        self._session.add(schedule)
        await self._session.flush()
        await self._session.refresh(schedule)
        return schedule

    async def get_schedule_by_id(
        self, schedule_id: uuid.UUID
    ) -> Optional[SlotSchedule]:
        result = await self._session.execute(
            select(SlotSchedule).where(SlotSchedule.id == schedule_id)
        )
        return result.scalar_one_or_none()

    async def delete_schedule(self, schedule_id: uuid.UUID) -> bool:
        schedule = await self.get_schedule_by_id(schedule_id)
        if schedule is None:
            return False
        await self._session.delete(schedule)
        await self._session.flush()
        return True

    # ── TrainerGymAssignment Operations ───────────────────────────────────────

    async def create_trainer_assignment(
        self, assignment: TrainerGymAssignment
    ) -> TrainerGymAssignment:
        self._session.add(assignment)
        await self._session.flush()
        await self._session.refresh(assignment)
        return assignment

    async def get_trainer_assignment(
        self, assignment_id: uuid.UUID
    ) -> Optional[TrainerGymAssignment]:
        result = await self._session.execute(
            select(TrainerGymAssignment).where(
                TrainerGymAssignment.id == assignment_id
            )
        )
        return result.scalar_one_or_none()

    async def list_trainer_assignments(
        self,
        trainer_id: Optional[uuid.UUID] = None,
        gym_id: Optional[uuid.UUID] = None,
    ) -> list[TrainerGymAssignment]:
        query = select(TrainerGymAssignment)
        if trainer_id is not None:
            query = query.where(TrainerGymAssignment.trainer_id == trainer_id)
        if gym_id is not None:
            query = query.where(TrainerGymAssignment.gym_id == gym_id)
        result = await self._session.execute(
            query.order_by(TrainerGymAssignment.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete_trainer_assignment(self, assignment_id: uuid.UUID) -> bool:
        assignment = await self.get_trainer_assignment(assignment_id)
        if assignment is None:
            return False
        await self._session.delete(assignment)
        await self._session.flush()
        return True
