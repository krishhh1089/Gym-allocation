import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, DBSession, require_roles
from app.exceptions.notification_exceptions import (
    AnnouncementNotFoundError,
    NotificationJobNotFoundError,
    NotificationNotFoundError,
    NotificationTemplateNotFoundError,
    TemplateRenderError,
)
from app.models.notification import (
    JobStatus,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
)
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import (
    AnnouncementCreate,
    AnnouncementResponse,
    CurrentUser,
    JobResponse,
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
    NotificationTemplateCreate,
    NotificationTemplateResponse,
    NotificationTemplateUpdate,
)
from app.services.notification_service import NotificationService

router = APIRouter()


def _get_service(session: DBSession) -> NotificationService:
    return NotificationService(NotificationRepository(session))


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@router.post(
    "/notifications",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send or enqueue a notification (Admin / System)",
)
async def send_notification(
    payload: NotificationCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> NotificationResponse:
    svc = _get_service(session)
    notification = await svc.send_notification(
        user_id=payload.user_id,
        subject=payload.subject,
        message=payload.message,
        type=payload.type,
        channel=payload.channel,
        deduplication_key=payload.deduplication_key,
    )
    await session.commit()
    await session.refresh(notification)
    return NotificationResponse.model_validate(notification)


@router.get(
    "/notifications/me",
    response_model=NotificationListResponse,
    summary="Get current user's notifications and unread count",
)
async def get_my_notifications(
    session: DBSession,
    current_user: CurrentUserDep,
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> NotificationListResponse:
    svc = _get_service(session)
    items, total, unread_count = await svc.list_user_notifications(
        user_id=current_user.user_id,
        unread_only=unread_only,
        page=page,
        size=size,
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        total=total,
        unread_count=unread_count,
        page=page,
        size=size,
    )


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a notification as read",
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> NotificationResponse:
    svc = _get_service(session)
    try:
        user_filter = (
            None
            if any(r in current_user.roles for r in ["ADMIN", "SUPER_ADMIN"])
            else current_user.user_id
        )
        notification = await svc.mark_as_read(notification_id, user_id=user_filter)
        await session.commit()
        await session.refresh(notification)
        return NotificationResponse.model_validate(notification)
    except NotificationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/notifications/read-all",
    summary="Mark all unread notifications for current user as read",
)
async def mark_all_read(
    session: DBSession,
    current_user: CurrentUserDep,
) -> dict:
    svc = _get_service(session)
    count = await svc.mark_all_as_read(current_user.user_id)
    await session.commit()
    return {"status": "ok", "marked_read": count}


@router.get(
    "/notifications",
    response_model=NotificationListResponse,
    summary="Query notifications with filters (Admin)",
)
async def list_notifications(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
    user_id: Optional[uuid.UUID] = Query(None),
    notif_type: Optional[NotificationType] = Query(None, alias="type"),
    channel: Optional[NotificationChannel] = Query(None),
    status_filter: Optional[NotificationStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> NotificationListResponse:
    svc = _get_service(session)
    items, total = await svc.list_notifications(
        user_id=user_id,
        type=notif_type,
        channel=channel,
        status=status_filter,
        page=page,
        size=size,
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        total=total,
        unread_count=0,
        page=page,
        size=size,
    )


@router.get(
    "/notifications/{notification_id}",
    response_model=NotificationResponse,
    summary="Get notification detail",
)
async def get_notification(
    notification_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> NotificationResponse:
    svc = _get_service(session)
    try:
        notification = await svc.get_notification(notification_id)
        if not any(r in current_user.roles for r in ["ADMIN", "SUPER_ADMIN"]):
            if notification.user_id != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot access other users' notifications",
                )
        return NotificationResponse.model_validate(notification)
    except NotificationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------

@router.post(
    "/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish an announcement (Admin)",
)
async def create_announcement(
    payload: AnnouncementCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> AnnouncementResponse:
    svc = _get_service(session)
    announcement = await svc.create_announcement(
        title=payload.title,
        content=payload.content,
        author_id=current_user.user_id,
        target_role=payload.target_role,
        is_published=True,
    )
    await session.commit()
    await session.refresh(announcement)
    return AnnouncementResponse.model_validate(announcement)


@router.get(
    "/announcements",
    response_model=List[AnnouncementResponse],
    summary="List published announcements",
)
async def list_announcements(
    session: DBSession,
    current_user: CurrentUserDep,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> List[AnnouncementResponse]:
    svc = _get_service(session)
    role = "STUDENT" if "STUDENT" in current_user.roles else None
    items, _ = await svc.list_announcements(
        target_role=role,
        is_published=True,
        page=page,
        size=size,
    )
    return [AnnouncementResponse.model_validate(a) for a in items]


@router.get(
    "/announcements/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Get announcement details",
)
async def get_announcement(
    announcement_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUserDep,
) -> AnnouncementResponse:
    svc = _get_service(session)
    try:
        announcement = await svc.get_announcement(announcement_id)
        return AnnouncementResponse.model_validate(announcement)
    except AnnouncementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete(
    "/announcements/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an announcement (Admin)",
)
async def delete_announcement(
    announcement_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> None:
    svc = _get_service(session)
    try:
        await svc.delete_announcement(announcement_id)
        await session.commit()
    except AnnouncementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

@router.post(
    "/templates",
    response_model=NotificationTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a notification template (Admin)",
)
async def create_template(
    payload: NotificationTemplateCreate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> NotificationTemplateResponse:
    svc = _get_service(session)
    template = await svc.create_template(
        code=payload.code,
        channel=payload.channel,
        subject_template=payload.subject_template,
        body_template=payload.body_template,
    )
    await session.commit()
    await session.refresh(template)
    return NotificationTemplateResponse.model_validate(template)


@router.get(
    "/templates",
    response_model=List[NotificationTemplateResponse],
    summary="List notification templates (Admin)",
)
async def list_templates(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
    is_active: Optional[bool] = Query(None),
) -> List[NotificationTemplateResponse]:
    svc = _get_service(session)
    templates = await svc.list_templates(is_active=is_active)
    return [NotificationTemplateResponse.model_validate(t) for t in templates]


@router.get(
    "/templates/{code}",
    response_model=NotificationTemplateResponse,
    summary="Get template by code (Admin)",
)
async def get_template(
    code: str,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> NotificationTemplateResponse:
    svc = _get_service(session)
    try:
        template = await svc.get_template(code)
        return NotificationTemplateResponse.model_validate(template)
    except NotificationTemplateNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put(
    "/templates/{code}",
    response_model=NotificationTemplateResponse,
    summary="Update a notification template (Admin)",
)
async def update_template(
    code: str,
    payload: NotificationTemplateUpdate,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> NotificationTemplateResponse:
    svc = _get_service(session)
    try:
        template = await svc.update_template(
            code=code,
            subject_template=payload.subject_template,
            body_template=payload.body_template,
            is_active=payload.is_active,
        )
        await session.commit()
        await session.refresh(template)
        return NotificationTemplateResponse.model_validate(template)
    except NotificationTemplateNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ---------------------------------------------------------------------------
# Delivery Jobs
# ---------------------------------------------------------------------------

@router.get(
    "/jobs",
    response_model=List[JobResponse],
    summary="List delivery jobs (Admin)",
)
async def list_jobs(
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
    job_status: Optional[JobStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> List[JobResponse]:
    svc = _get_service(session)
    items, _ = await svc.list_jobs(status=job_status, page=page, size=size)
    return [JobResponse.model_validate(j) for j in items]


@router.post(
    "/jobs/{job_id}/retry",
    response_model=JobResponse,
    summary="Retry a failed or dead-letter job (Admin)",
)
async def retry_job(
    job_id: uuid.UUID,
    session: DBSession,
    current_user: CurrentUser = Depends(require_roles("ADMIN", "SUPER_ADMIN")),
) -> JobResponse:
    svc = _get_service(session)
    try:
        job = await svc.retry_job(job_id)
        await session.commit()
        await session.refresh(job)
        return JobResponse.model_validate(job)
    except NotificationJobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
