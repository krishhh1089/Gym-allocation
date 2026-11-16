"""
StudentService — business logic for student profile management.

Responsibilities:
  • Create / provision student profiles.
  • Enforce uniqueness of registration_number and email.
  • Role-aware update rules (student vs admin).
  • Pagination and filtering.
  • Status transitions.
  • Raise appropriate custom exceptions.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.student_exceptions import (
    DuplicateEmailError,
    DuplicateRegistrationNumberError,
    StudentNotFoundError,
)
from app.models.student import AccountStatus, Student
from app.repositories.student_repository import StudentRepository
from app.schemas.student import (
    StudentAdminUpdate,
    StudentCreate,
    StudentListResponse,
    StudentResponse,
    StudentStatusUpdate,
    StudentUpdate,
)


def _to_response(student: Student) -> StudentResponse:
    return StudentResponse.model_validate(student)


class StudentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = StudentRepository(session)

    # ── Create ────────────────────────────────────────────────────────────────

    async def create_student(self, payload: StudentCreate) -> Student:
        """
        Provision a new student profile.
        Raises DuplicateRegistrationNumberError or DuplicateEmailError on conflict.
        """
        email = payload.email.lower().strip()

        # Uniqueness checks
        existing_reg = await self._repo.get_by_registration_number(
            payload.registration_number
        )
        if existing_reg is not None:
            raise DuplicateRegistrationNumberError(
                f"Registration number '{payload.registration_number}' is already in use."
            )

        existing_email = await self._repo.get_by_email(email)
        if existing_email is not None:
            raise DuplicateEmailError(
                f"Email '{email}' is already associated with another student."
            )

        student = Student(
            identity_user_id=payload.identity_user_id,
            registration_number=payload.registration_number,
            full_name=payload.full_name,
            email=email,
            department=payload.department,
            programme=payload.programme,
            academic_year=payload.academic_year,
            semester=payload.semester,
            phone_number=payload.phone_number,
            profile_photo_url=payload.profile_photo_url,
            account_status=payload.account_status,
        )
        return await self._repo.create(student)

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_student(self, student_id: uuid.UUID) -> Student:
        student = await self._repo.get_by_id(student_id)
        if student is None:
            raise StudentNotFoundError(f"Student '{student_id}' not found.")
        return student

    async def get_student_by_identity_user_id(
        self, identity_user_id: uuid.UUID
    ) -> Optional[Student]:
        return await self._repo.get_by_identity_user_id(identity_user_id)

    async def list_students(
        self,
        skip: int = 0,
        limit: int = 20,
        department: Optional[str] = None,
        programme: Optional[str] = None,
        status: Optional[AccountStatus] = None,
        search: Optional[str] = None,
    ) -> StudentListResponse:
        limit = min(limit, 100)  # enforce max page size
        students, total = await self._repo.list_students(
            skip=skip,
            limit=limit,
            department=department,
            programme=programme,
            status=status,
            search=search,
        )
        return StudentListResponse(
            items=[_to_response(s) for s in students],
            total=total,
            skip=skip,
            limit=limit,
        )

    # ── Update (student self-service — limited fields) ────────────────────────

    async def update_my_profile(
        self, identity_user_id: uuid.UUID, payload: StudentUpdate
    ) -> Student:
        """
        A student can update only their own phone_number and profile_photo_url.
        Returns the updated Student.
        """
        student = await self._repo.get_by_identity_user_id(identity_user_id)
        if student is None:
            raise StudentNotFoundError(
                f"No student profile linked to user '{identity_user_id}'."
            )

        update_data: dict = {}
        if payload.phone_number is not None:
            update_data["phone_number"] = payload.phone_number
        if payload.profile_photo_url is not None:
            update_data["profile_photo_url"] = payload.profile_photo_url

        if update_data:
            updated = await self._repo.update(student.id, update_data)
            return updated
        return student

    # ── Update (admin) ────────────────────────────────────────────────────────

    async def admin_update_student(
        self, student_id: uuid.UUID, payload: StudentAdminUpdate
    ) -> Student:
        """
        Admin can update a broader set of fields.
        """
        student = await self._repo.get_by_id(student_id)
        if student is None:
            raise StudentNotFoundError(f"Student '{student_id}' not found.")

        update_data: dict = {}
        if payload.full_name is not None:
            update_data["full_name"] = payload.full_name
        if payload.department is not None:
            update_data["department"] = payload.department
        if payload.programme is not None:
            update_data["programme"] = payload.programme
        if payload.academic_year is not None:
            update_data["academic_year"] = payload.academic_year
        if payload.semester is not None:
            update_data["semester"] = payload.semester
        if payload.phone_number is not None:
            update_data["phone_number"] = payload.phone_number
        if payload.profile_photo_url is not None:
            update_data["profile_photo_url"] = payload.profile_photo_url
        if payload.identity_user_id is not None:
            update_data["identity_user_id"] = payload.identity_user_id

        if update_data:
            updated = await self._repo.update(student_id, update_data)
            return updated
        return student

    # ── Status update ─────────────────────────────────────────────────────────

    async def update_status(
        self, student_id: uuid.UUID, payload: StudentStatusUpdate
    ) -> Student:
        student = await self._repo.get_by_id(student_id)
        if student is None:
            raise StudentNotFoundError(f"Student '{student_id}' not found.")

        updated = await self._repo.update_status(student_id, payload.account_status)
        return updated
