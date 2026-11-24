"""
Students router — CRUD for student profiles with RBAC.

Endpoints:
  GET  /health                            — liveness check (no auth)
  POST /students                          — ADMIN, SUPER_ADMIN
  GET  /students                          — ADMIN, SUPER_ADMIN, TRAINER
  GET  /students/me                       — STUDENT (own profile)
  GET  /students/{student_id}             — ADMIN, SUPER_ADMIN, TRAINER
  PATCH /students/me                      — STUDENT (limited fields)
  PATCH /students/{student_id}            — ADMIN, SUPER_ADMIN
  PATCH /students/{student_id}/status     — ADMIN, SUPER_ADMIN
"""

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, DBSession, require_roles
from app.exceptions.student_exceptions import (
    DuplicateEmailError,
    DuplicateRegistrationNumberError,
    StudentNotFoundError,
)
from app.models.student import AccountStatus
from app.schemas.student import (
    StudentAdminUpdate,
    StudentCreate,
    StudentListResponse,
    StudentResponse,
    StudentStatusUpdate,
    StudentUpdate,
)
from app.services.student_service import StudentService

router = APIRouter(tags=["Students"])

# ── Guards ────────────────────────────────────────────────────────────────────
_admin_guard = Depends(require_roles("ADMIN", "SUPER_ADMIN"))
_read_guard = Depends(require_roles("ADMIN", "SUPER_ADMIN", "TRAINER"))
_student_guard = Depends(require_roles("STUDENT"))


def _svc(db: DBSession) -> StudentService:
    return StudentService(db)


# ── POST /students — provision a new student ──────────────────────────────────

@router.post(
    "/students",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Provision a new student profile",
    dependencies=[_admin_guard],
)
async def create_student(payload: StudentCreate, db: DBSession):
    svc = _svc(db)
    try:
        student = await svc.create_student(payload)
        await db.commit()
        await db.refresh(student)
    except DuplicateRegistrationNumberError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return StudentResponse.model_validate(student)


# ── GET /students/me — student sees own profile ───────────────────────────────

@router.get(
    "/students/me",
    response_model=StudentResponse,
    summary="Get own student profile (STUDENT only)",
    dependencies=[_student_guard],
)
async def get_my_profile(current_user: CurrentUserDep, db: DBSession):
    svc = _svc(db)
    try:
        student = await svc.get_student_by_identity_user_id(current_user.user_id)
        if student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No student profile linked to your account.",
            )
    except StudentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return StudentResponse.model_validate(student)


# ── GET /students — paginated list ────────────────────────────────────────────

@router.get(
    "/students",
    response_model=StudentListResponse,
    summary="List students with optional filters (ADMIN, SUPER_ADMIN, TRAINER)",
    dependencies=[_read_guard],
)
async def list_students(
    db: DBSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    department: Optional[str] = None,
    programme: Optional[str] = None,
    status: Optional[AccountStatus] = None,
    search: Optional[str] = None,
):
    svc = _svc(db)
    return await svc.list_students(
        skip=skip,
        limit=limit,
        department=department,
        programme=programme,
        status=status,
        search=search,
    )


# ── GET /students/{student_id} — get a single student ────────────────────────

@router.get(
    "/students/{student_id}",
    response_model=StudentResponse,
    summary="Get a student by ID (ADMIN, SUPER_ADMIN, TRAINER)",
    dependencies=[_read_guard],
)
async def get_student(student_id: uuid.UUID, db: DBSession):
    svc = _svc(db)
    try:
        student = await svc.get_student(student_id)
    except StudentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return StudentResponse.model_validate(student)


# ── PATCH /students/me — student self-update (limited fields) ─────────────────

@router.patch(
    "/students/me",
    response_model=StudentResponse,
    summary="Update own profile (STUDENT — limited fields)",
    dependencies=[_student_guard],
)
async def update_my_profile(
    payload: StudentUpdate, current_user: CurrentUserDep, db: DBSession
):
    svc = _svc(db)
    try:
        student = await svc.update_my_profile(current_user.user_id, payload)
        await db.commit()
        await db.refresh(student)
    except StudentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return StudentResponse.model_validate(student)


# ── PATCH /students/{student_id} — admin update ───────────────────────────────

@router.patch(
    "/students/{student_id}",
    response_model=StudentResponse,
    summary="Admin update of a student profile (ADMIN, SUPER_ADMIN)",
    dependencies=[_admin_guard],
)
async def admin_update_student(
    student_id: uuid.UUID, payload: StudentAdminUpdate, db: DBSession
):
    svc = _svc(db)
    try:
        student = await svc.admin_update_student(student_id, payload)
        await db.commit()
        await db.refresh(student)
    except StudentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return StudentResponse.model_validate(student)


# ── PATCH /students/{student_id}/status — status update ──────────────────────

@router.patch(
    "/students/{student_id}/status",
    response_model=StudentResponse,
    summary="Update student account status (ADMIN, SUPER_ADMIN)",
    dependencies=[_admin_guard],
)
async def update_student_status(
    student_id: uuid.UUID, payload: StudentStatusUpdate, db: DBSession
):
    svc = _svc(db)
    try:
        student = await svc.update_status(student_id, payload)
        await db.commit()
        await db.refresh(student)
    except StudentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return StudentResponse.model_validate(student)
