import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse

from app.api.deps import CurrentUserDep, DBSession, require_roles
from app.exceptions.report_exceptions import (
    AuditLogNotFoundError,
    ReportNotFoundError,
)
from app.models.report import (
    ReportFormat,
    ReportStatus,
    ReportType,
)
from app.repositories.report_repository import ReportRepository
from app.schemas.report import (
    AnalyticsSummaryResponse,
    AuditLogCreate,
    AuditLogListResponse,
    AuditLogResponse,
    CurrentUser,
    ReportCreate,
    ReportListResponse,
    ReportResponse,
)
from app.services.report_service import ReportService

router = APIRouter()


def _get_service(session: DBSession) -> ReportService:
    return ReportService(ReportRepository(session))


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

@router.post(
    "/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a report (Admin)",
)
async def create_report(
    payload: ReportCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> ReportResponse:
    svc = _get_service(session)
    report = await svc.generate_report(
        name=payload.name,
        type=payload.type,
        format=payload.format,
        created_by=current_user.user_id,
        parameters=payload.parameters,
    )
    await session.commit()
    await session.refresh(report)
    return ReportResponse.model_validate(report)


@router.get(
    "/reports",
    response_model=ReportListResponse,
    summary="List generated reports (Admin)",
)
async def list_reports(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
    report_type: Optional[ReportType] = Query(None, alias="type"),
    report_status: Optional[ReportStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> ReportListResponse:
    svc = _get_service(session)
    items, total = await svc.list_reports(
        type=report_type,
        status=report_status,
        page=page,
        size=size,
    )
    return ReportListResponse(
        items=[ReportResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/reports/{report_id}",
    response_model=ReportResponse,
    summary="Get report metadata (Admin)",
)
async def get_report(
    report_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> ReportResponse:
    svc = _get_service(session)
    try:
        report = await svc.get_report(report_id)
        return ReportResponse.model_validate(report)
    except ReportNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get(
    "/reports/{report_id}/download",
    summary="Download report content as CSV (Admin)",
)
async def download_report(
    report_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> Response:
    svc = _get_service(session)
    try:
        report = await svc.get_report(report_id)
        content = await svc.generate_csv_content(report)
        filename = f"{report.name.replace(' ', '_').lower()}.csv"
        return PlainTextResponse(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ReportNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete(
    "/reports/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a report (Admin)",
)
async def delete_report(
    report_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> None:
    svc = _get_service(session)
    try:
        await svc.delete_report(report_id)
        await session.commit()
    except ReportNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ---------------------------------------------------------------------------
# Analytics Projections
# ---------------------------------------------------------------------------

@router.get(
    "/analytics/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Get operational dashboard analytics summary (Trainer / Admin)",
)
async def get_analytics_summary(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("TRAINER", "ADMIN", "SUPER_ADMIN")),
) -> AnalyticsSummaryResponse:
    svc = _get_service(session)
    return await svc.get_analytics_summary()


# ---------------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------------

@router.post(
    "/audit-logs",
    response_model=AuditLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record an audit activity log entry (Admin / Internal)",
)
async def record_audit_log(
    payload: AuditLogCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> AuditLogResponse:
    svc = _get_service(session)
    log = await svc.record_audit_log(
        actor_id=payload.actor_id,
        action=payload.action,
        target_type=payload.target_type,
        target_id=payload.target_id,
        before_state=payload.before_state,
        after_state=payload.after_state,
        reason=payload.reason,
        correlation_id=payload.correlation_id,
    )
    await session.commit()
    await session.refresh(log)
    return AuditLogResponse.model_validate(log)


@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    summary="Query audit activity logs (Admin)",
)
async def list_audit_logs(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
    actor_id: Optional[uuid.UUID] = Query(None),
    action: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> AuditLogListResponse:
    svc = _get_service(session)
    items, total = await svc.list_audit_logs(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        date_from=date_from,
        date_to=date_to,
        page=page,
        size=size,
    )
    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(a) for a in items],
        total=total,
        page=page,
        size=size,
    )


@router.get(
    "/audit-logs/{audit_id}",
    response_model=AuditLogResponse,
    summary="Get audit log details (Admin)",
)
async def get_audit_log(
    audit_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> AuditLogResponse:
    svc = _get_service(session)
    try:
        log = await svc.get_audit_log(audit_id)
        return AuditLogResponse.model_validate(log)
    except AuditLogNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
