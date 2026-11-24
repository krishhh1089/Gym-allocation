import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, DBSession, require_roles
from app.exceptions.complaint_exceptions import (
    ComplaintNotFoundError,
    InvalidStatusTransitionError,
    SupportRequestNotFoundError,
    UnauthorizedActionError,
)
from app.models.complaint import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
    SupportCategory,
    SupportStatus,
)
from app.repositories.complaint_repository import ComplaintRepository
from app.schemas.complaint import (
    ComplaintAssign,
    ComplaintCommentCreate,
    ComplaintCommentResponse,
    ComplaintCreate,
    ComplaintDetailResponse,
    ComplaintListResponse,
    ComplaintResponse,
    ComplaintStatusUpdate,
    CurrentUser,
    SupportRequestCreate,
    SupportRequestListResponse,
    SupportRequestResponse,
    SupportRequestUpdate,
)
from app.services.complaint_service import ComplaintService

router = APIRouter()


def _get_service(session: DBSession) -> ComplaintService:
    return ComplaintService(ComplaintRepository(session))


# ---------------------------------------------------------------------------
# Complaints
# ---------------------------------------------------------------------------

@router.post(
    "/complaints",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a formal complaint",
)
async def submit_complaint(
    payload: ComplaintCreate,
    session: DBSession,
    current_user: CurrentUserDep,
) -> ComplaintResponse:
    svc = _get_service(session)
    complaint = await svc.create_complaint(
        student_id=current_user.user_id,
        submitted_by=current_user.user_id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
    )
    await session.commit()
    await session.refresh(complaint)
    return ComplaintResponse.model_validate(complaint)


@router.get(
    "/complaints/me",
    response_model=ComplaintListResponse,
    summary="Get current user's submitted complaints",
)
async def get_my_complaints(
    session: DBSession,
    current_user: CurrentUserDep,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> ComplaintListResponse:
    svc = _get_service(session)
    items, total = await svc.list_complaints(
        student_id=current_user.user_id,
        page=page,
        size=size,
    )
    return ComplaintListResponse(
        items=[ComplaintResponse.model_validate(c) for c in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/complaints",
    response_model=ComplaintListResponse,
    summary="Query complaints with filters (Trainer / Admin)",
)
async def list_complaints(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
    student_id: Optional[uuid.UUID] = Query(None),
    category: Optional[ComplaintCategory] = Query(None),
    comp_status: Optional[ComplaintStatus] = Query(None, alias="status"),
    priority: Optional[ComplaintPriority] = Query(None),
    assigned_to: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> ComplaintListResponse:
    svc = _get_service(session)
    items, total = await svc.list_complaints(
        student_id=student_id,
        category=category,
        status=comp_status,
        priority=priority,
        assigned_to=assigned_to,
        page=page,
        size=size,
    )
    return ComplaintListResponse(
        items=[ComplaintResponse.model_validate(c) for c in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/complaints/{complaint_id}",
    response_model=ComplaintDetailResponse,
    summary="Get complaint details with comments",
)
async def get_complaint(
    complaint_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> ComplaintDetailResponse:
    svc = _get_service(session)
    try:
        complaint = await svc.get_complaint(complaint_id)
        if not any(r in current_user.roles for r in ["ADMIN", "SUPER_ADMIN", "TRAINER"]):
            if complaint.student_id != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot view another student's complaint",
                )
        return ComplaintDetailResponse(
            id=complaint.id,
            student_id=complaint.student_id,
            submitted_by=complaint.submitted_by,
            category=complaint.category,
            title=complaint.title,
            description=complaint.description,
            status=complaint.status,
            priority=complaint.priority,
            assigned_to=complaint.assigned_to,
            resolution_notes=complaint.resolution_notes,
            resolved_at=complaint.resolved_at,
            created_at=complaint.created_at,
            updated_at=complaint.updated_at,
            comments=[ComplaintCommentResponse.model_validate(c) for c in complaint.comments],
        )
    except ComplaintNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch(
    "/complaints/{complaint_id}/status",
    response_model=ComplaintResponse,
    summary="Update complaint status & resolution (Trainer / Admin)",
)
async def update_complaint_status(
    complaint_id: uuid.UUID,
    payload: ComplaintStatusUpdate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
) -> ComplaintResponse:
    svc = _get_service(session)
    try:
        complaint = await svc.update_status(
            complaint_id=complaint_id,
            status=payload.status,
            resolution_notes=payload.resolution_notes,
        )
        await session.commit()
        await session.refresh(complaint)
        return ComplaintResponse.model_validate(complaint)
    except ComplaintNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch(
    "/complaints/{complaint_id}/assign",
    response_model=ComplaintResponse,
    summary="Assign complaint to staff member (Admin)",
)
async def assign_complaint(
    complaint_id: uuid.UUID,
    payload: ComplaintAssign,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> ComplaintResponse:
    svc = _get_service(session)
    try:
        complaint = await svc.assign_complaint(complaint_id, payload.assigned_to)
        await session.commit()
        await session.refresh(complaint)
        return ComplaintResponse.model_validate(complaint)
    except ComplaintNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/complaints/{complaint_id}/comments",
    response_model=ComplaintCommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a complaint",
)
async def add_complaint_comment(
    complaint_id: uuid.UUID,
    payload: ComplaintCommentCreate,
    session: DBSession,
    current_user: CurrentUserDep,
) -> ComplaintCommentResponse:
    svc = _get_service(session)
    try:
        complaint = await svc.get_complaint(complaint_id)
        if not any(r in current_user.roles for r in ["ADMIN", "SUPER_ADMIN", "TRAINER"]):
            if complaint.student_id != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot comment on another student's complaint",
                )
        comment = await svc.add_comment(
            complaint_id=complaint_id,
            user_id=current_user.user_id,
            comment=payload.comment,
        )
        await session.commit()
        await session.refresh(comment)
        return ComplaintCommentResponse.model_validate(comment)
    except ComplaintNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ---------------------------------------------------------------------------
# Support Requests
# ---------------------------------------------------------------------------

@router.post(
    "/support-requests",
    response_model=SupportRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an in-app operational support request",
)
async def submit_support_request(
    payload: SupportRequestCreate,
    session: DBSession,
    current_user: CurrentUserDep,
) -> SupportRequestResponse:
    svc = _get_service(session)
    req = await svc.create_support_request(
        student_id=current_user.user_id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
    )
    await session.commit()
    await session.refresh(req)
    return SupportRequestResponse.model_validate(req)


@router.get(
    "/support-requests/me",
    response_model=SupportRequestListResponse,
    summary="Get current user's submitted support requests",
)
async def get_my_support_requests(
    session: DBSession,
    current_user: CurrentUserDep,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> SupportRequestListResponse:
    svc = _get_service(session)
    items, total = await svc.list_support_requests(
        student_id=current_user.user_id,
        page=page,
        size=size,
    )
    return SupportRequestListResponse(
        items=[SupportRequestResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/support-requests",
    response_model=SupportRequestListResponse,
    summary="List all support requests (Trainer / Admin)",
)
async def list_support_requests(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
    student_id: Optional[uuid.UUID] = Query(None),
    category: Optional[SupportCategory] = Query(None),
    req_status: Optional[SupportStatus] = Query(None, alias="status"),
    assigned_to: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> SupportRequestListResponse:
    svc = _get_service(session)
    items, total = await svc.list_support_requests(
        student_id=student_id,
        category=category,
        status=req_status,
        assigned_to=assigned_to,
        page=page,
        size=size,
    )
    return SupportRequestListResponse(
        items=[SupportRequestResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/support-requests/{request_id}",
    response_model=SupportRequestResponse,
    summary="Get support request details",
)
async def get_support_request(
    request_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> SupportRequestResponse:
    svc = _get_service(session)
    try:
        req = await svc.get_support_request(request_id)
        if not any(r in current_user.roles for r in ["ADMIN", "SUPER_ADMIN", "TRAINER"]):
            if req.student_id != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot view another student's support request",
                )
        return SupportRequestResponse.model_validate(req)
    except SupportRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch(
    "/support-requests/{request_id}",
    response_model=SupportRequestResponse,
    summary="Update support request status, resolution, or assignment (Trainer / Admin)",
)
async def update_support_request(
    request_id: uuid.UUID,
    payload: SupportRequestUpdate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
) -> SupportRequestResponse:
    svc = _get_service(session)
    try:
        req = await svc.update_support_request(
            request_id=request_id,
            status=payload.status,
            resolution=payload.resolution,
            assigned_to=payload.assigned_to,
        )
        await session.commit()
        await session.refresh(req)
        return SupportRequestResponse.model_validate(req)
    except SupportRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
