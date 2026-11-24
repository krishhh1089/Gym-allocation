"""
Repository layer for Student and PhotoChangeRequest.

All database access is isolated here — no raw SQL in service or API layers.
"""

import uuid
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student import AccountStatus, PhotoChangeRequest, Student


class StudentRepository:

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, student: Student) -> Student:
        self._session.add(student)
        await self._session.flush()
        await self._session.refresh(student)
        return student

    async def get_by_id(self, student_id: uuid.UUID) -> Optional[Student]:
        result = await self._session.execute(
            select(Student).where(Student.id == student_id)
        )
        return result.scalar_one_or_none()

    async def get_by_identity_user_id(
        self, identity_user_id: uuid.UUID
    ) -> Optional[Student]:
        result = await self._session.execute(
            select(Student).where(Student.identity_user_id == identity_user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_registration_number(
        self, registration_number: str
    ) -> Optional[Student]:
        result = await self._session.execute(
            select(Student).where(
                Student.registration_number == registration_number
            )
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Student]:
        result = await self._session.execute(
            select(Student).where(Student.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def list_students(
        self,
        skip: int = 0,
        limit: int = 20,
        department: Optional[str] = None,
        programme: Optional[str] = None,
        status: Optional[AccountStatus] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Student], int]:
        """
        Return (students, total_count) applying optional filters.
        search matches full_name or registration_number (case-insensitive).
        """
        base_query = select(Student)

        if department:
            base_query = base_query.where(
                func.lower(Student.department) == department.lower()
            )
        if programme:
            base_query = base_query.where(
                func.lower(Student.programme) == programme.lower()
            )
        if status:
            base_query = base_query.where(Student.account_status == status)
        if search:
            pattern = f"%{search.lower()}%"
            base_query = base_query.where(
                or_(
                    func.lower(Student.full_name).like(pattern),
                    func.lower(Student.registration_number).like(pattern),
                )
            )

        # Count total matching rows
        count_result = await self._session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        # Paginated fetch
        result = await self._session.execute(
            base_query.order_by(Student.created_at.desc()).offset(skip).limit(limit)
        )
        students = list(result.scalars().all())
        return students, total

    async def update(
        self, student_id: uuid.UUID, update_data: dict
    ) -> Optional[Student]:
        student = await self.get_by_id(student_id)
        if student is None:
            return None
        for key, value in update_data.items():
            if hasattr(student, key) and value is not None:
                setattr(student, key, value)
        self._session.add(student)
        await self._session.flush()
        await self._session.refresh(student)
        return student

    async def update_status(
        self, student_id: uuid.UUID, status: AccountStatus
    ) -> Optional[Student]:
        student = await self.get_by_id(student_id)
        if student is None:
            return None
        student.account_status = status
        self._session.add(student)
        await self._session.flush()
        await self._session.refresh(student)
        return student

    async def save(self, student: Student) -> Student:
        self._session.add(student)
        await self._session.flush()
        await self._session.refresh(student)
        return student
