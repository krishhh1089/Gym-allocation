"""
Domain service for managing Gym facilities, Gym Slots, Schedules, and Trainer Assignments.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.slot_exceptions import (
    DuplicateGymNameError,
    GymNotFoundError,
    InvalidScheduleTimeError,
    ScheduleNotFoundError,
    SlotNotFoundError,
    TrainerAssignmentNotFoundError,
)
from app.models.gym import Gym, GymSlot, SlotSchedule, TrainerGymAssignment
from app.repositories.slot_repository import SlotRepository
from app.schemas.gym import (
    GymCreate,
    GymListResponse,
    GymResponse,
    GymSlotCreate,
    GymSlotListResponse,
    GymSlotResponse,
    GymSlotUpdate,
    GymUpdate,
    SlotScheduleCreate,
    SlotScheduleResponse,
    TrainerAssignmentCreate,
    TrainerAssignmentListResponse,
    TrainerAssignmentResponse,
)


def _to_gym_response(gym: Gym) -> GymResponse:
    return GymResponse.model_validate(gym)


def _to_slot_response(slot: GymSlot) -> GymSlotResponse:
    return GymSlotResponse.model_validate(slot)


class SlotService:

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = SlotRepository(session)

    # ── Gym Methods ───────────────────────────────────────────────────────────

    async def create_gym(self, payload: GymCreate) -> Gym:
        existing = await self._repo.get_gym_by_name(payload.name)
        if existing is not None:
            raise DuplicateGymNameError(
                f"A gym with the name '{payload.name}' already exists."
            )
        gym = Gym(
            name=payload.name.strip(),
            location=payload.location.strip(),
            eligibility_group=payload.eligibility_group.strip(),
            is_active=payload.is_active,
        )
        return await self._repo.create_gym(gym)

    async def get_gym(self, gym_id: uuid.UUID) -> Gym:
        gym = await self._repo.get_gym_by_id(gym_id)
        if gym is None:
            raise GymNotFoundError(f"Gym with id '{gym_id}' not found.")
        return gym

    async def list_gyms(
        self,
        skip: int = 0,
        limit: int = 20,
        is_active: Optional[bool] = None,
    ) -> GymListResponse:
        limit = min(limit, 100)
        gyms, total = await self._repo.list_gyms(
            skip=skip, limit=limit, is_active=is_active
        )
        return GymListResponse(
            items=[_to_gym_response(g) for g in gyms],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_gym(self, gym_id: uuid.UUID, payload: GymUpdate) -> Gym:
        gym = await self.get_gym(gym_id)

        update_data = {}
        if payload.name is not None:
            existing = await self._repo.get_gym_by_name(payload.name)
            if existing is not None and existing.id != gym_id:
                raise DuplicateGymNameError(
                    f"A gym with the name '{payload.name}' already exists."
                )
            update_data["name"] = payload.name.strip()
        if payload.location is not None:
            update_data["location"] = payload.location.strip()
        if payload.eligibility_group is not None:
            update_data["eligibility_group"] = payload.eligibility_group.strip()
        if payload.is_active is not None:
            update_data["is_active"] = payload.is_active

        if update_data:
            updated = await self._repo.update_gym(gym_id, update_data)
            return updated
        return gym

    # ── GymSlot Methods ───────────────────────────────────────────────────────

    async def create_slot(self, payload: GymSlotCreate) -> GymSlot:
        # Validate that the gym exists
        await self.get_gym(payload.gym_id)

        slot = GymSlot(
            gym_id=payload.gym_id,
            name=payload.name,
            capacity=payload.capacity,
            is_active=payload.is_active,
        )

        # Attach initial schedules if provided
        if payload.schedules:
            for s_data in payload.schedules:
                if s_data.end_time <= s_data.start_time:
                    raise InvalidScheduleTimeError(
                        "start_time must be earlier than end_time."
                    )
                slot.schedules.append(
                    SlotSchedule(
                        day_of_week=s_data.day_of_week.upper(),
                        start_time=s_data.start_time,
                        end_time=s_data.end_time,
                        effective_from=s_data.effective_from,
                        effective_until=s_data.effective_until,
                    )
                )

        return await self._repo.create_slot(slot)

    async def get_slot(self, slot_id: uuid.UUID) -> GymSlot:
        slot = await self._repo.get_slot_by_id(slot_id)
        if slot is None:
            raise SlotNotFoundError(f"Gym slot with id '{slot_id}' not found.")
        return slot

    async def list_slots(
        self,
        skip: int = 0,
        limit: int = 20,
        gym_id: Optional[uuid.UUID] = None,
        is_active: Optional[bool] = None,
    ) -> GymSlotListResponse:
        limit = min(limit, 100)
        slots, total = await self._repo.list_slots(
            skip=skip, limit=limit, gym_id=gym_id, is_active=is_active
        )
        return GymSlotListResponse(
            items=[_to_slot_response(s) for s in slots],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_slot(
        self, slot_id: uuid.UUID, payload: GymSlotUpdate
    ) -> GymSlot:
        slot = await self.get_slot(slot_id)

        update_data = {}
        if payload.name is not None:
            update_data["name"] = payload.name
        if payload.capacity is not None:
            update_data["capacity"] = payload.capacity
        if payload.is_active is not None:
            update_data["is_active"] = payload.is_active

        if update_data:
            updated = await self._repo.update_slot(slot_id, update_data)
            return updated
        return slot

    async def delete_slot(self, slot_id: uuid.UUID) -> None:
        await self.get_slot(slot_id)
        await self._repo.delete_slot(slot_id)

    # ── Schedule Methods ──────────────────────────────────────────────────────

    async def add_schedule(
        self, slot_id: uuid.UUID, payload: SlotScheduleCreate
    ) -> SlotSchedule:
        await self.get_slot(slot_id)
        if payload.end_time <= payload.start_time:
            raise InvalidScheduleTimeError("start_time must be earlier than end_time.")

        schedule = SlotSchedule(
            slot_id=slot_id,
            day_of_week=payload.day_of_week.upper(),
            start_time=payload.start_time,
            end_time=payload.end_time,
            effective_from=payload.effective_from,
            effective_until=payload.effective_until,
        )
        return await self._repo.create_schedule(schedule)

    async def delete_schedule(self, schedule_id: uuid.UUID) -> None:
        schedule = await self._repo.get_schedule_by_id(schedule_id)
        if schedule is None:
            raise ScheduleNotFoundError(
                f"Schedule with id '{schedule_id}' not found."
            )
        await self._repo.delete_schedule(schedule_id)

    # ── Trainer Assignment Methods ────────────────────────────────────────────

    async def assign_trainer(
        self, payload: TrainerAssignmentCreate
    ) -> TrainerGymAssignment:
        await self.get_gym(payload.gym_id)
        assignment = TrainerGymAssignment(
            trainer_id=payload.trainer_id,
            gym_id=payload.gym_id,
            effective_from=payload.effective_from,
            effective_until=payload.effective_until,
        )
        return await self._repo.create_trainer_assignment(assignment)

    async def list_trainer_assignments(
        self,
        trainer_id: Optional[uuid.UUID] = None,
        gym_id: Optional[uuid.UUID] = None,
    ) -> TrainerAssignmentListResponse:
        items = await self._repo.list_trainer_assignments(
            trainer_id=trainer_id, gym_id=gym_id
        )
        return TrainerAssignmentListResponse(
            items=[TrainerAssignmentResponse.model_validate(a) for a in items],
            total=len(items),
        )

    async def remove_trainer_assignment(self, assignment_id: uuid.UUID) -> None:
        assignment = await self._repo.get_trainer_assignment(assignment_id)
        if assignment is None:
            raise TrainerAssignmentNotFoundError(
                f"Trainer assignment '{assignment_id}' not found."
            )
        await self._repo.delete_trainer_assignment(assignment_id)
