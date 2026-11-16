"""
REST endpoints for Registration Windows, Applications, Allocations,
Gym Card Tokens, and Slot Transfers.
"""

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, DBSession, require_roles
from app.exceptions.allocation_exceptions import (
    ActiveAllocationConflictError,
    AllocationNotFoundError,
    ApplicationNotFoundError,
    DuplicateApplicationError,
    InvalidTransferRequestError,
    RegistrationWindowClosedError,
    RegistrationWindowNotFoundError,
    SlotCapacityNotFoundError,
    SlotChangeRequestNotFoundError,
    SlotFullError,
)
from app.schemas.allocation import (
    AllocationListResponse,
    AllocationResponse,
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    GymCardTokenResponse,
    GymCardVerifyRequest,
    GymCardVerifyResponse,
    RegistrationWindowCreate,
    RegistrationWindowListResponse,
    RegistrationWindowResponse,
    RegistrationWindowUpdate,
    SlotCapacityResponse,
    SlotCapacitySet,
    SlotChangeRequestCreate,
    SlotChangeRequestListResponse,
    SlotChangeRequestResponse,
    SlotChangeRequestReview,
    WaitlistPositionResponse,
)
from app.services.allocation_service import AllocationService

router = APIRouter()

# ── Role Guards ───────────────────────────────────────────────────────────────
_admin_guard = Depends(require_roles("ADMIN", "SUPER_ADMIN"))
_staff_guard = Depends(require_roles("ADMIN", "SUPER_ADMIN", "TRAINER"))
_student_guard = Depends(require_roles("STUDENT"))
_any_auth = Depends(require_roles("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"))


def _svc(db: DBSession) -> AllocationService:
    return AllocationService(db)


# ── Registration Windows ──────────────────────────────────────────────────────

@router.post(
    "/windows",
    response_model=RegistrationWindowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create registration window (Admin)",
    dependencies=[_admin_guard],
    tags=["Registration Windows"],
)
async def create_window(
    payload: RegistrationWindowCreate, current_user: CurrentUserDep, db: DBSession
):
    svc = _svc(db)
    window = await svc.create_window(payload, created_by=current_user.user_id)
    await db.commit()
    await db.refresh(window)
    return RegistrationWindowResponse.model_validate(window)


@router.get(
    "/windows",
    response_model=RegistrationWindowListResponse,
    summary="List registration windows",
    dependencies=[_any_auth],
    tags=["Registration Windows"],
)
async def list_windows(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    status: Optional[str] = None,
):
    svc = _svc(db)
    return await svc.list_windows(skip=skip, limit=limit, status=status)


@router.get(
    "/windows/{window_id}",
    response_model=RegistrationWindowResponse,
    summary="Get registration window details",
    dependencies=[_any_auth],
    tags=["Registration Windows"],
)
async def get_window(window_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        window = await svc.get_window(window_id)
    except RegistrationWindowNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return RegistrationWindowResponse.model_validate(window)


@router.patch(
    "/windows/{window_id}",
    response_model=RegistrationWindowResponse,
    summary="Update registration window (Admin)",
    dependencies=[_admin_guard],
    tags=["Registration Windows"],
)
async def update_window(
    window_id: uuid.UUID, payload: RegistrationWindowUpdate, db: DBSession
):
    svc = _svc(db)
    try:
        window = await svc.update_window(window_id, payload)
        await db.commit()
        await db.refresh(window)
    except RegistrationWindowNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return RegistrationWindowResponse.model_validate(window)


# ── Slot Capacities ───────────────────────────────────────────────────────────

@router.post(
    "/capacities",
    response_model=SlotCapacityResponse,
    summary="Set capacity ceiling for a gym slot (Admin)",
    dependencies=[_admin_guard],
    tags=["Slot Capacity"],
)
async def set_slot_capacity(payload: SlotCapacitySet, db: DBSession):
    svc = _svc(db)
    cap = await svc.set_slot_capacity(payload)
    await db.commit()
    return cap


@router.get(
    "/capacities/{slot_id}",
    response_model=SlotCapacityResponse,
    summary="Get capacity status for a gym slot",
    dependencies=[_any_auth],
    tags=["Slot Capacity"],
)
async def get_slot_capacity(slot_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        return await svc.get_slot_capacity(slot_id)
    except SlotCapacityNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ── Applications & Waitlists ──────────────────────────────────────────────────

@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for a gym slot with FCFS waitlisting (Student)",
    dependencies=[_student_guard],
    tags=["Applications"],
)
async def apply_for_slot(
    payload: ApplicationCreate, current_user: CurrentUserDep, db: DBSession
):
    svc = _svc(db)
    try:
        app_obj = await svc.apply_for_slot(current_user.user_id, payload)
        await db.commit()
        await db.refresh(app_obj)
    except RegistrationWindowNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RegistrationWindowClosedError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except ActiveAllocationConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except DuplicateApplicationError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return ApplicationResponse.model_validate(app_obj)


@router.get(
    "/applications/me",
    response_model=ApplicationListResponse,
    summary="List own submitted applications (Student)",
    dependencies=[_student_guard],
    tags=["Applications"],
)
async def list_my_applications(
    current_user: CurrentUserDep,
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    items, total = await _svc(db)._repo.list_applications(
        skip=skip, limit=limit, student_id=current_user.user_id
    )
    return ApplicationListResponse(
        items=[ApplicationResponse.model_validate(a) for a in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/applications/{application_id}/waitlist",
    response_model=WaitlistPositionResponse,
    summary="Check waitlist queue position for an application (Student)",
    dependencies=[_student_guard],
    tags=["Applications"],
)
async def check_waitlist_position(
    application_id: uuid.UUID, current_user: CurrentUserDep, db: DBSession
):
    svc = _svc(db)
    try:
        return await svc.get_waitlist_position(current_user.user_id, application_id)
    except ApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get(
    "/applications",
    response_model=ApplicationListResponse,
    summary="List all applications (Staff/Admin)",
    dependencies=[_staff_guard],
    tags=["Applications"],
)
async def list_applications(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    slot_id: Optional[uuid.UUID] = None,
    student_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
):
    items, total = await _svc(db)._repo.list_applications(
        skip=skip, limit=limit, slot_id=slot_id, student_id=student_id, status=status
    )
    return ApplicationListResponse(
        items=[ApplicationResponse.model_validate(a) for a in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Allocations ───────────────────────────────────────────────────────────────

@router.get(
    "/allocations/me",
    response_model=AllocationResponse,
    summary="Get active gym allocation (Student)",
    dependencies=[_student_guard],
    tags=["Allocations"],
)
async def get_my_allocation(current_user: CurrentUserDep, db: DBSession):
    alloc = await _svc(db)._repo.get_active_allocation_by_student(current_user.user_id)
    if alloc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active gym allocation found.",
        )
    return AllocationResponse.model_validate(alloc)


@router.get(
    "/allocations",
    response_model=AllocationListResponse,
    summary="List allocations (Staff/Admin)",
    dependencies=[_staff_guard],
    tags=["Allocations"],
)
async def list_allocations(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    student_id: Optional[uuid.UUID] = None,
    slot_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
):
    items, total = await _svc(db)._repo.list_allocations(
        skip=skip, limit=limit, student_id=student_id, slot_id=slot_id, status=status
    )
    return AllocationListResponse(
        items=[AllocationResponse.model_validate(a) for a in items],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Gym Card Dynamic QR Tokens ────────────────────────────────────────────────

@router.post(
    "/gym-card/token",
    response_model=GymCardTokenResponse,
    summary="Generate a dynamic short-lived QR token for attendance (Student)",
    dependencies=[_student_guard],
    tags=["Gym Card"],
)
async def generate_qr_pass(current_user: CurrentUserDep, db: DBSession):
    svc = _svc(db)
    try:
        resp = await svc.generate_card_token(current_user.user_id)
        await db.commit()
        return resp
    except AllocationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/gym-card/verify",
    response_model=GymCardVerifyResponse,
    summary="Verify an attendance QR token (Trainer / Staff)",
    dependencies=[_staff_guard],
    tags=["Gym Card"],
)
async def verify_qr_pass(payload: GymCardVerifyRequest, db: DBSession):
    svc = _svc(db)
    return await svc.verify_card_token(payload.token)


# ── Slot Transfers ────────────────────────────────────────────────────────────

@router.post(
    "/transfers",
    response_model=SlotChangeRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a safe slot transfer request (Student)",
    dependencies=[_student_guard],
    tags=["Transfers"],
)
async def request_transfer(
    payload: SlotChangeRequestCreate, current_user: CurrentUserDep, db: DBSession
):
    svc = _svc(db)
    try:
        req = await svc.request_slot_transfer(current_user.user_id, payload)
        await db.commit()
        await db.refresh(req)
    except AllocationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidTransferRequestError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return SlotChangeRequestResponse.model_validate(req)


@router.get(
    "/transfers/me",
    response_model=SlotChangeRequestListResponse,
    summary="List own submitted transfer requests (Student)",
    dependencies=[_student_guard],
    tags=["Transfers"],
)
async def list_my_transfers(
    current_user: CurrentUserDep,
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    items, total = await _svc(db)._repo.list_transfer_requests(
        skip=skip, limit=limit, student_id=current_user.user_id
    )
    return SlotChangeRequestListResponse(
        items=[SlotChangeRequestResponse.model_validate(r) for r in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/transfers",
    response_model=SlotChangeRequestListResponse,
    summary="List all slot transfer requests (Admin)",
    dependencies=[_admin_guard],
    tags=["Transfers"],
)
async def list_transfers(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    status: Optional[str] = None,
):
    items, total = await _svc(db)._repo.list_transfer_requests(
        skip=skip, limit=limit, status=status
    )
    return SlotChangeRequestListResponse(
        items=[SlotChangeRequestResponse.model_validate(r) for r in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/transfers/{request_id}/review",
    response_model=SlotChangeRequestResponse,
    summary="Approve or reject a slot transfer request (Admin)",
    dependencies=[_admin_guard],
    tags=["Transfers"],
)
async def review_transfer(
    request_id: uuid.UUID,
    payload: SlotChangeRequestReview,
    current_user: CurrentUserDep,
    db: DBSession,
):
    svc = _svc(db)
    try:
        reviewed = await svc.review_slot_transfer(
            request_id, payload, reviewer_id=current_user.user_id
        )
        await db.commit()
        await db.refresh(reviewed)
    except SlotChangeRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidTransferRequestError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except AllocationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except SlotFullError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return SlotChangeRequestResponse.model_validate(reviewed)
