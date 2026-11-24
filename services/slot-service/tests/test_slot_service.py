"""
Unit tests for SlotService business logic.
"""

from datetime import time
import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.slot_exceptions import (
    DuplicateGymNameError,
    GymNotFoundError,
    InvalidScheduleTimeError,
    ScheduleNotFoundError,
    SlotNotFoundError,
    TrainerAssignmentNotFoundError,
)
from app.schemas.gym import (
    GymCreate,
    GymSlotCreate,
    GymSlotUpdate,
    GymUpdate,
    SlotScheduleCreate,
    TrainerAssignmentCreate,
)
from app.services.slot_service import SlotService


@pytest.mark.asyncio
async def test_create_gym_success(db_session: AsyncSession):
    svc = SlotService(db_session)
    payload = GymCreate(
        name="C. V. Raman Gym",
        location="Hostel Block A",
        eligibility_group="BOYS",
    )
    gym = await svc.create_gym(payload)
    await db_session.commit()
    assert gym.id is not None
    assert gym.name == "C. V. Raman Gym"
    assert gym.is_active is True


@pytest.mark.asyncio
async def test_create_gym_duplicate_name_raises(db_session: AsyncSession):
    svc = SlotService(db_session)
    payload = GymCreate(name="Ganga Gym", location="Campus Center")
    await svc.create_gym(payload)
    await db_session.commit()

    with pytest.raises(DuplicateGymNameError):
        await svc.create_gym(payload)


@pytest.mark.asyncio
async def test_get_gym_found_and_not_found(db_session: AsyncSession):
    svc = SlotService(db_session)
    gym = await svc.create_gym(GymCreate(name="Krishna Gym", location="North Wing"))
    await db_session.commit()

    found = await svc.get_gym(gym.id)
    assert found.name == "Krishna Gym"

    with pytest.raises(GymNotFoundError):
        await svc.get_gym(uuid.uuid4())


@pytest.mark.asyncio
async def test_update_gym(db_session: AsyncSession):
    svc = SlotService(db_session)
    gym = await svc.create_gym(GymCreate(name="Narmada Gym", location="East Wing"))
    await db_session.commit()

    updated = await svc.update_gym(gym.id, GymUpdate(location="New East Complex", is_active=False))
    await db_session.commit()
    assert updated.location == "New East Complex"
    assert updated.is_active is False


@pytest.mark.asyncio
async def test_create_slot_with_schedules(db_session: AsyncSession):
    svc = SlotService(db_session)
    gym = await svc.create_gym(GymCreate(name="Multi Gym", location="Sports Complex"))
    await db_session.commit()

    slot_payload = GymSlotCreate(
        gym_id=gym.id,
        name="Morning Slot A",
        capacity=25,
        schedules=[
            SlotScheduleCreate(
                day_of_week="MONDAY",
                start_time=time(6, 0),
                end_time=time(7, 0),
            )
        ],
    )
    slot = await svc.create_slot(slot_payload)
    await db_session.commit()
    assert slot.capacity == 25
    assert len(slot.schedules) == 1
    assert slot.schedules[0].day_of_week == "MONDAY"


@pytest.mark.asyncio
async def test_create_slot_invalid_gym_raises(db_session: AsyncSession):
    svc = SlotService(db_session)
    slot_payload = GymSlotCreate(
        gym_id=uuid.uuid4(),
        capacity=30,
    )
    with pytest.raises(GymNotFoundError):
        await svc.create_slot(slot_payload)


@pytest.mark.asyncio
async def test_update_and_delete_slot(db_session: AsyncSession):
    svc = SlotService(db_session)
    gym = await svc.create_gym(GymCreate(name="Gym 1", location="Area 1"))
    slot = await svc.create_slot(GymSlotCreate(gym_id=gym.id, capacity=20))
    await db_session.commit()

    updated = await svc.update_slot(slot.id, GymSlotUpdate(capacity=35))
    await db_session.commit()
    assert updated.capacity == 35

    await svc.delete_slot(slot.id)
    await db_session.commit()

    with pytest.raises(SlotNotFoundError):
        await svc.get_slot(slot.id)


@pytest.mark.asyncio
async def test_add_and_delete_schedule(db_session: AsyncSession):
    svc = SlotService(db_session)
    gym = await svc.create_gym(GymCreate(name="Gym 2", location="Area 2"))
    slot = await svc.create_slot(GymSlotCreate(gym_id=gym.id, capacity=15))
    await db_session.commit()

    schedule = await svc.add_schedule(
        slot.id,
        SlotScheduleCreate(
            day_of_week="TUESDAY",
            start_time=time(17, 0),
            end_time=time(18, 0),
        ),
    )
    await db_session.commit()
    assert schedule.id is not None

    await svc.delete_schedule(schedule.id)
    await db_session.commit()

    with pytest.raises(ScheduleNotFoundError):
        await svc.delete_schedule(schedule.id)


@pytest.mark.asyncio
async def test_trainer_assignment_lifecycle(db_session: AsyncSession):
    svc = SlotService(db_session)
    gym = await svc.create_gym(GymCreate(name="Gym 3", location="Area 3"))
    await db_session.commit()

    trainer_id = uuid.uuid4()
    assignment = await svc.assign_trainer(
        TrainerAssignmentCreate(trainer_id=trainer_id, gym_id=gym.id)
    )
    await db_session.commit()
    assert assignment.trainer_id == trainer_id

    listing = await svc.list_trainer_assignments(gym_id=gym.id)
    assert listing.total == 1

    await svc.remove_trainer_assignment(assignment.id)
    await db_session.commit()

    with pytest.raises(TrainerAssignmentNotFoundError):
        await svc.remove_trainer_assignment(assignment.id)
