import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, DBSession, require_roles
from app.exceptions.attendance_exceptions import (
    AbsencePolicyNotFoundError,
    AttendanceCorrectionError,
    AttendanceRecordNotFoundError,
    AttendanceSessionNotFoundError,
    DuplicateAttendanceError,
    ExemptionAlreadyExistsError,
    ExemptionNotFoundError,
    InvalidTokenError,
    SessionCancelledError,
    SessionNotOpenError,
)
from app.models.attendance import AttendanceStatus, SessionStatus
from app.repositories.attendance_repository import AttendanceRepository
from app.schemas.attendance import (
    AbsenceCandidateResponse,
    AbsencePolicyResponse,
    AbsencePolicyUpdate,
    AttendanceCorrectionCreate,
    AttendanceCorrectionResponse,
    AttendanceListResponse,
    AttendanceManualRequest,
    AttendanceRecordDetailResponse,
    AttendanceRecordResponse,
    AttendanceScanRequest,
    AttendanceSummaryResponse,
    CurrentUser,
    ExemptionCreate,
    ExemptionResponse,
    GymCardTokenRegisterRequest,
    GymCardTokenResponse,
    ScanOutcomeResponse,
    SessionCreate,
    SessionListResponse,
    SessionResponse,
    SessionStatusUpdate,
)
from app.services.attendance_service import AttendanceService

router = APIRouter()


def _get_service(session: DBSession) -> AttendanceService:
    return AttendanceService(AttendanceRepository(session))


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a scheduled session (Admin)",
)
async def create_session(
    payload: SessionCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> SessionResponse:
    svc = _get_service(session)
    try:
        session_obj = await svc.create_session(
            slot_id=payload.slot_id,
            session_date=payload.session_date,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
        )
        await session.commit()
        await session.refresh(session_obj)
        return SessionResponse.model_validate(session_obj)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get(
    "/sessions",
    response_model=SessionListResponse,
    summary="List sessions with pagination and filters",
)
async def list_sessions(
    session: DBSession,
    current_user: CurrentUserDep,
    slot_id: Optional[uuid.UUID] = Query(None),
    session_date: Optional[date] = Query(None),
    session_status: Optional[SessionStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> SessionListResponse:
    svc = _get_service(session)
    items, total = await svc.list_sessions(
        slot_id=slot_id,
        session_date=session_date,
        status=session_status,
        page=page,
        size=size,
    )
    return SessionListResponse(
        items=[SessionResponse.model_validate(s) for s in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/sessions/today",
    response_model=List[SessionResponse],
    summary="List today's active sessions (Trainer / Admin)",
)
async def get_today_sessions(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
    target_date: Optional[date] = Query(None),
) -> List[SessionResponse]:
    svc = _get_service(session)
    sessions = await svc.get_today_sessions(target_date)
    return [SessionResponse.model_validate(s) for s in sessions]


@router.get(
    "/sessions/{session_id}",
    response_model=SessionResponse,
    summary="Get session details",
)
async def get_session_by_id(
    session_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> SessionResponse:
    svc = _get_service(session)
    try:
        session_obj = await svc.get_session(session_id)
        return SessionResponse.model_validate(session_obj)
    except AttendanceSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch(
    "/sessions/{session_id}/status",
    response_model=SessionResponse,
    summary="Update session status (e.g. CANCELLED) (Trainer / Admin)",
)
async def update_session_status(
    session_id: uuid.UUID,
    payload: SessionStatusUpdate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
) -> SessionResponse:
    svc = _get_service(session)
    try:
        session_obj = await svc.update_session_status(session_id, payload.status)
        await session.commit()
        await session.refresh(session_obj)
        return SessionResponse.model_validate(session_obj)
    except AttendanceSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get(
    "/sessions/{session_id}/roster",
    response_model=List[AttendanceRecordResponse],
    summary="Get attendance roster for a session (Trainer / Admin)",
)
async def get_session_roster(
    session_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
) -> List[AttendanceRecordResponse]:
    svc = _get_service(session)
    try:
        records = await svc.get_session_roster(session_id)
        return [AttendanceRecordResponse.model_validate(r) for r in records]
    except AttendanceSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ---------------------------------------------------------------------------
# Attendance Recording (QR Scanner & Manual Fallback)
# ---------------------------------------------------------------------------

@router.post(
    "/attendance/scan",
    response_model=ScanOutcomeResponse,
    summary="Scan student QR token to record attendance (Trainer / Admin)",
)
async def scan_attendance(
    payload: AttendanceScanRequest,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
) -> ScanOutcomeResponse:
    svc = _get_service(session)
    try:
        outcome, record = await svc.process_qr_scan(
            raw_token=payload.raw_token,
            session_id=payload.session_id,
            student_id=payload.student_id,
            allocation_id=payload.allocation_id,
            staff_id=current_user.user_id,
        )
        await session.commit()
        await session.refresh(record)
        outcome.attendance = AttendanceRecordResponse.model_validate(record)
        return outcome
    except AttendanceSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (SessionNotOpenError, SessionCancelledError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except DuplicateAttendanceError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post(
    "/attendance/manual",
    response_model=AttendanceRecordResponse,
    summary="Record attendance via manual AP search fallback (Trainer / Admin)",
)
async def manual_attendance(
    payload: AttendanceManualRequest,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
) -> AttendanceRecordResponse:
    svc = _get_service(session)
    try:
        record = await svc.process_manual_attendance(
            session_id=payload.session_id,
            student_id=payload.student_id,
            allocation_id=payload.allocation_id,
            staff_id=current_user.user_id,
            status=payload.status,
            reason=payload.reason,
        )
        await session.commit()
        await session.refresh(record)
        return AttendanceRecordResponse.model_validate(record)
    except AttendanceSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except SessionCancelledError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except DuplicateAttendanceError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


# ---------------------------------------------------------------------------
# Attendance Records & Queries
# ---------------------------------------------------------------------------

@router.get(
    "/attendance/me",
    response_model=AttendanceSummaryResponse,
    summary="Get current student's attendance summary and statistics",
)
async def get_my_attendance_summary(
    session: DBSession,
    current_user: CurrentUserDep,
) -> AttendanceSummaryResponse:
    svc = _get_service(session)
    return await svc.get_student_summary(current_user.user_id)


@router.get(
    "/attendance/student/{student_id}",
    response_model=AttendanceSummaryResponse,
    summary="Get attendance summary for a specific student",
)
async def get_student_attendance_summary(
    student_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> AttendanceSummaryResponse:
    # If student role, they can only view their own summary
    if "STUDENT" in current_user.roles and not any(r in current_user.roles for r in ["ADMIN", "SUPER_ADMIN", "TRAINER"]):
        if current_user.user_id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view their own attendance records",
            )
    svc = _get_service(session)
    return await svc.get_student_summary(student_id)


@router.get(
    "/attendance",
    response_model=AttendanceListResponse,
    summary="List attendance records with filters and pagination (Trainer / Admin)",
)
async def list_attendance(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
    student_id: Optional[uuid.UUID] = Query(None),
    session_id: Optional[uuid.UUID] = Query(None),
    session_date: Optional[date] = Query(None),
    att_status: Optional[AttendanceStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> AttendanceListResponse:
    svc = _get_service(session)
    records, total = await svc.list_records(
        student_id=student_id,
        session_id=session_id,
        session_date=session_date,
        status=att_status,
        page=page,
        size=size,
    )
    return AttendanceListResponse(
        items=[AttendanceRecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/attendance/{attendance_id}",
    response_model=AttendanceRecordDetailResponse,
    summary="Get detailed attendance record with correction history",
)
async def get_attendance_detail(
    attendance_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> AttendanceRecordDetailResponse:
    svc = _get_service(session)
    try:
        record = await svc.get_record(attendance_id)
        if "STUDENT" in current_user.roles and not any(r in current_user.roles for r in ["ADMIN", "SUPER_ADMIN", "TRAINER"]):
            if current_user.user_id != record.student_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Students can only view their own attendance records",
                )
        return AttendanceRecordDetailResponse(
            id=record.id,
            student_id=record.student_id,
            allocation_id=record.allocation_id,
            session_id=record.session_id,
            session_date=record.session_date,
            status=record.status,
            check_in_time=record.check_in_time,
            method=record.method,
            staff_id=record.staff_id,
            created_at=record.created_at,
            updated_at=record.updated_at,
            corrections=[AttendanceCorrectionResponse.model_validate(c) for c in record.corrections],
        )
    except AttendanceRecordNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/attendance/{attendance_id}/correct",
    response_model=AttendanceRecordDetailResponse,
    summary="Administratively correct or invalidate an attendance record (Admin)",
)
async def correct_attendance(
    attendance_id: uuid.UUID,
    payload: AttendanceCorrectionCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> AttendanceRecordDetailResponse:
    svc = _get_service(session)
    try:
        record, _ = await svc.correct_attendance(
            attendance_id=attendance_id,
            new_status=payload.new_status,
            reason=payload.reason,
            corrected_by=current_user.user_id,
        )
        await session.commit()
        session.expire_all()
        refreshed = await svc.get_record(attendance_id)
        return AttendanceRecordDetailResponse(
            id=refreshed.id,
            student_id=refreshed.student_id,
            allocation_id=refreshed.allocation_id,
            session_id=refreshed.session_id,
            session_date=refreshed.session_date,
            status=refreshed.status,
            check_in_time=refreshed.check_in_time,
            method=refreshed.method,
            staff_id=refreshed.staff_id,
            created_at=refreshed.created_at,
            updated_at=refreshed.updated_at,
            corrections=[AttendanceCorrectionResponse.model_validate(c) for c in refreshed.corrections],
        )
    except AttendanceRecordNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except AttendanceCorrectionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ---------------------------------------------------------------------------
# Exemptions
# ---------------------------------------------------------------------------

@router.post(
    "/exemptions",
    response_model=ExemptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Grant an attendance exemption for a session (Admin)",
)
async def create_exemption(
    payload: ExemptionCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> ExemptionResponse:
    svc = _get_service(session)
    try:
        exemption = await svc.create_exemption(
            session_id=payload.session_id,
            student_id=payload.student_id,
            reason=payload.reason,
            created_by=current_user.user_id,
        )
        await session.commit()
        await session.refresh(exemption)
        return ExemptionResponse.model_validate(exemption)
    except AttendanceSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ExemptionAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.get(
    "/exemptions",
    response_model=List[ExemptionResponse],
    summary="List exemptions (Trainer / Admin)",
)
async def list_exemptions(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
    student_id: Optional[uuid.UUID] = Query(None),
    session_id: Optional[uuid.UUID] = Query(None),
) -> List[ExemptionResponse]:
    svc = _get_service(session)
    exemptions = await svc.list_exemptions(student_id=student_id, session_id=session_id)
    return [ExemptionResponse.model_validate(e) for e in exemptions]


@router.delete(
    "/exemptions/{exemption_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an attendance exemption (Admin)",
)
async def delete_exemption(
    exemption_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> None:
    svc = _get_service(session)
    try:
        await svc.delete_exemption(exemption_id)
        await session.commit()
    except ExemptionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ---------------------------------------------------------------------------
# Absence Policy & Monitoring
# ---------------------------------------------------------------------------

@router.get(
    "/policies/absence",
    response_model=AbsencePolicyResponse,
    summary="Get active absence policy",
)
async def get_absence_policy(
    session: DBSession,
    current_user: CurrentUserDep,
) -> AbsencePolicyResponse:
    svc = _get_service(session)
    policy = await svc.get_active_policy()
    return AbsencePolicyResponse.model_validate(policy)


@router.put(
    "/policies/absence",
    response_model=AbsencePolicyResponse,
    summary="Configure active absence threshold policy (Admin)",
)
async def update_absence_policy(
    payload: AbsencePolicyUpdate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> AbsencePolicyResponse:
    svc = _get_service(session)
    policy = await svc.update_policy(
        threshold=payload.consecutive_absence_threshold,
        updated_by=current_user.user_id,
    )
    await session.commit()
    await session.refresh(policy)
    return AbsencePolicyResponse.model_validate(policy)


@router.get(
    "/monitoring/absence-candidates",
    response_model=List[AbsenceCandidateResponse],
    summary="Get students approaching absence warnings or termination threshold (Admin)",
)
async def get_absence_candidates(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> List[AbsenceCandidateResponse]:
    svc = _get_service(session)
    return await svc.get_absence_candidates()


# ---------------------------------------------------------------------------
# Gym Card Token Sync / Registration
# ---------------------------------------------------------------------------

@router.post(
    "/tokens/register",
    response_model=GymCardTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a short-lived QR token hash for attendance verification",
)
async def register_qr_token(
    payload: GymCardTokenRegisterRequest,
    session: DBSession,
    current_user: CurrentUserDep,
) -> GymCardTokenResponse:
    svc = _get_service(session)
    token = await svc.register_token(
        student_id=payload.student_id,
        allocation_id=payload.allocation_id,
        token_hash=payload.token_hash,
        expires_at=payload.expires_at,
        session_id=payload.session_id,
    )
    await session.commit()
    return GymCardTokenResponse.model_validate(token)
