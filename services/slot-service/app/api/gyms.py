"""
REST endpoints for Gyms, Slots, Schedules, and Trainer Assignments.
"""

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, DBSession, require_roles
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
from app.services.slot_service import SlotService

router = APIRouter()

# ── Role Guards ───────────────────────────────────────────────────────────────
_admin_guard = Depends(require_roles("ADMIN", "SUPER_ADMIN"))
_staff_guard = Depends(require_roles("ADMIN", "SUPER_ADMIN", "TRAINER"))
_any_auth = Depends(require_roles("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"))


def _svc(db: DBSession) -> SlotService:
    return SlotService(db)


# ── Gyms ──────────────────────────────────────────────────────────────────────

@router.post(
    "/gyms",
    response_model=GymResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new gym facility (Admin only)",
    dependencies=[_admin_guard],
    tags=["Gyms"],
)
async def create_gym(payload: GymCreate, db: DBSession):
    svc = _svc(db)
    try:
        gym = await svc.create_gym(payload)
        await db.commit()
        await db.refresh(gym)
    except DuplicateGymNameError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return GymResponse.model_validate(gym)


@router.get(
    "/gyms",
    response_model=GymListResponse,
    summary="List gym facilities",
    dependencies=[_any_auth],
    tags=["Gyms"],
)
async def list_gyms(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    is_active: Optional[bool] = None,
):
    svc = _svc(db)
    return await svc.list_gyms(skip=skip, limit=limit, is_active=is_active)


@router.get(
    "/gyms/{gym_id}",
    response_model=GymResponse,
    summary="Get gym facility details and its slots",
    dependencies=[_any_auth],
    tags=["Gyms"],
)
async def get_gym(gym_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        gym = await svc.get_gym(gym_id)
    except GymNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return GymResponse.model_validate(gym)


@router.patch(
    "/gyms/{gym_id}",
    response_model=GymResponse,
    summary="Update gym facility details (Admin only)",
    dependencies=[_admin_guard],
    tags=["Gyms"],
)
async def update_gym(gym_id: uuid.UUID, payload: GymUpdate, db: DBSession):
    svc = _svc(db)
    try:
        gym = await svc.update_gym(gym_id, payload)
        await db.commit()
        await db.refresh(gym)
    except GymNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DuplicateGymNameError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return GymResponse.model_validate(gym)


# ── GymSlots ──────────────────────────────────────────────────────────────────

@router.post(
    "/slots",
    response_model=GymSlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new gym slot with optional schedule (Admin only)",
    dependencies=[_admin_guard],
    tags=["Slots"],
)
async def create_slot(payload: GymSlotCreate, db: DBSession):
    svc = _svc(db)
    try:
        slot = await svc.create_slot(payload)
        await db.commit()
        await db.refresh(slot)
    except GymNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidScheduleTimeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return GymSlotResponse.model_validate(slot)


@router.get(
    "/slots",
    response_model=GymSlotListResponse,
    summary="List gym slots with optional gym_id filter",
    dependencies=[_any_auth],
    tags=["Slots"],
)
async def list_slots(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    gym_id: Optional[uuid.UUID] = None,
    is_active: Optional[bool] = None,
):
    svc = _svc(db)
    return await svc.list_slots(
        skip=skip, limit=limit, gym_id=gym_id, is_active=is_active
    )


@router.get(
    "/slots/{slot_id}",
    response_model=GymSlotResponse,
    summary="Get slot details and schedules",
    dependencies=[_any_auth],
    tags=["Slots"],
)
async def get_slot(slot_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        slot = await svc.get_slot(slot_id)
    except SlotNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return GymSlotResponse.model_validate(slot)


@router.patch(
    "/slots/{slot_id}",
    response_model=GymSlotResponse,
    summary="Update gym slot (capacity / status) (Admin only)",
    dependencies=[_admin_guard],
    tags=["Slots"],
)
async def update_slot(slot_id: uuid.UUID, payload: GymSlotUpdate, db: DBSession):
    svc = _svc(db)
    try:
        slot = await svc.update_slot(slot_id, payload)
        await db.commit()
        await db.refresh(slot)
    except SlotNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return GymSlotResponse.model_validate(slot)


@router.delete(
    "/slots/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a gym slot (Admin only)",
    dependencies=[_admin_guard],
    tags=["Slots"],
)
async def delete_slot(slot_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        await svc.delete_slot(slot_id)
        await db.commit()
    except SlotNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ── Schedules ─────────────────────────────────────────────────────────────────

@router.post(
    "/slots/{slot_id}/schedules",
    response_model=SlotScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a schedule timing to a slot (Admin only)",
    dependencies=[_admin_guard],
    tags=["Schedules"],
)
async def add_schedule(
    slot_id: uuid.UUID, payload: SlotScheduleCreate, db: DBSession
):
    svc = _svc(db)
    try:
        schedule = await svc.add_schedule(slot_id, payload)
        await db.commit()
        await db.refresh(schedule)
    except SlotNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidScheduleTimeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return SlotScheduleResponse.model_validate(schedule)


@router.delete(
    "/schedules/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a slot schedule (Admin only)",
    dependencies=[_admin_guard],
    tags=["Schedules"],
)
async def delete_schedule(schedule_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        await svc.delete_schedule(schedule_id)
        await db.commit()
    except ScheduleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ── Trainer Assignments ───────────────────────────────────────────────────────

@router.post(
    "/trainers/assignments",
    response_model=TrainerAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign a trainer to a gym facility (Admin only)",
    dependencies=[_admin_guard],
    tags=["Trainer Assignments"],
)
async def assign_trainer(payload: TrainerAssignmentCreate, db: DBSession):
    svc = _svc(db)
    try:
        assignment = await svc.assign_trainer(payload)
        await db.commit()
        await db.refresh(assignment)
    except GymNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return TrainerAssignmentResponse.model_validate(assignment)


@router.get(
    "/trainers/assignments",
    response_model=TrainerAssignmentListResponse,
    summary="List trainer gym assignments (Staff only)",
    dependencies=[_staff_guard],
    tags=["Trainer Assignments"],
)
async def list_trainer_assignments(
    db: DBSession,
    trainer_id: Optional[uuid.UUID] = None,
    gym_id: Optional[uuid.UUID] = None,
):
    svc = _svc(db)
    return await svc.list_trainer_assignments(trainer_id=trainer_id, gym_id=gym_id)


@router.delete(
    "/trainers/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a trainer gym assignment (Admin only)",
    dependencies=[_admin_guard],
    tags=["Trainer Assignments"],
)
async def delete_trainer_assignment(assignment_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        await svc.remove_trainer_assignment(assignment_id)
        await db.commit()
    except TrainerAssignmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
