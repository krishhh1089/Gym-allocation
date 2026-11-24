import uuid
from datetime import date, datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance import (
    AbsencePolicy,
    AttendanceCorrection,
    AttendanceExemption,
    AttendanceRecord,
    AttendanceSession,
    AttendanceStatus,
    CheckInMethod,
    GymCardToken,
    SessionStatus,
)


class AttendanceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ---------------------------------------------------------------------------
    # Session Management
    # ---------------------------------------------------------------------------

    async def create_session(
        self,
        slot_id: uuid.UUID,
        session_date: date,
        starts_at: datetime,
        ends_at: datetime,
    ) -> AttendanceSession:
        attendance_session = AttendanceSession(
            slot_id=slot_id,
            session_date=session_date,
            starts_at=starts_at,
            ends_at=ends_at,
            status=SessionStatus.SCHEDULED,
        )
        self.session.add(attendance_session)
        await self.session.flush()
        return attendance_session

    async def get_session_by_id(self, session_id: uuid.UUID) -> Optional[AttendanceSession]:
        stmt = (
            select(AttendanceSession)
            .options(selectinload(AttendanceSession.attendance_records))
            .where(AttendanceSession.id == session_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_session_by_slot_and_date(
        self,
        slot_id: uuid.UUID,
        session_date: date,
    ) -> Optional[AttendanceSession]:
        stmt = select(AttendanceSession).where(
            AttendanceSession.slot_id == slot_id,
            AttendanceSession.session_date == session_date,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_sessions(
        self,
        slot_id: Optional[uuid.UUID] = None,
        session_date: Optional[date] = None,
        status: Optional[SessionStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[AttendanceSession], int]:
        conditions = []
        if slot_id is not None:
            conditions.append(AttendanceSession.slot_id == slot_id)
        if session_date is not None:
            conditions.append(AttendanceSession.session_date == session_date)
        if status is not None:
            conditions.append(AttendanceSession.status == status)

        count_stmt = select(func.count(AttendanceSession.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(AttendanceSession)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(AttendanceSession.session_date), AttendanceSession.starts_at)
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_today_sessions(self, target_date: date) -> List[AttendanceSession]:
        stmt = (
            select(AttendanceSession)
            .where(AttendanceSession.session_date == target_date)
            .order_by(AttendanceSession.starts_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_session_status(
        self,
        session_id: uuid.UUID,
        status: SessionStatus,
    ) -> Optional[AttendanceSession]:
        session_obj = await self.get_session_by_id(session_id)
        if not session_obj:
            return None
        session_obj.status = status
        await self.session.flush()
        return session_obj

    # ---------------------------------------------------------------------------
    # Attendance Records
    # ---------------------------------------------------------------------------

    async def create_record(
        self,
        student_id: uuid.UUID,
        allocation_id: uuid.UUID,
        session_id: uuid.UUID,
        session_date: date,
        status: AttendanceStatus,
        check_in_time: Optional[datetime] = None,
        method: Optional[CheckInMethod] = None,
        staff_id: Optional[uuid.UUID] = None,
    ) -> AttendanceRecord:
        record = AttendanceRecord(
            student_id=student_id,
            allocation_id=allocation_id,
            session_id=session_id,
            session_date=session_date,
            status=status,
            check_in_time=check_in_time,
            method=method,
            staff_id=staff_id,
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def get_record_by_id(self, record_id: uuid.UUID) -> Optional[AttendanceRecord]:
        stmt = (
            select(AttendanceRecord)
            .options(
                selectinload(AttendanceRecord.corrections),
                selectinload(AttendanceRecord.session),
            )
            .where(AttendanceRecord.id == record_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_record_by_student_and_session(
        self,
        student_id: uuid.UUID,
        session_id: uuid.UUID,
    ) -> Optional[AttendanceRecord]:
        stmt = (
            select(AttendanceRecord)
            .options(selectinload(AttendanceRecord.corrections))
            .where(
                AttendanceRecord.student_id == student_id,
                AttendanceRecord.session_id == session_id,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_records_for_session(self, session_id: uuid.UUID) -> List[AttendanceRecord]:
        stmt = (
            select(AttendanceRecord)
            .options(selectinload(AttendanceRecord.corrections))
            .where(AttendanceRecord.session_id == session_id)
            .order_by(AttendanceRecord.check_in_time.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_records(
        self,
        student_id: Optional[uuid.UUID] = None,
        session_id: Optional[uuid.UUID] = None,
        session_date: Optional[date] = None,
        status: Optional[AttendanceStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[AttendanceRecord], int]:
        conditions = []
        if student_id is not None:
            conditions.append(AttendanceRecord.student_id == student_id)
        if session_id is not None:
            conditions.append(AttendanceRecord.session_id == session_id)
        if session_date is not None:
            conditions.append(AttendanceRecord.session_date == session_date)
        if status is not None:
            conditions.append(AttendanceRecord.status == status)

        count_stmt = select(func.count(AttendanceRecord.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(AttendanceRecord)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(AttendanceRecord.session_date), desc(AttendanceRecord.check_in_time))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_student_records(self, student_id: uuid.UUID) -> List[AttendanceRecord]:
        stmt = (
            select(AttendanceRecord)
            .options(selectinload(AttendanceRecord.corrections))
            .where(AttendanceRecord.student_id == student_id)
            .order_by(desc(AttendanceRecord.session_date))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ---------------------------------------------------------------------------
    # Attendance Corrections
    # ---------------------------------------------------------------------------

    async def add_correction(
        self,
        attendance_id: uuid.UUID,
        corrected_by: uuid.UUID,
        old_status: str,
        new_status: str,
        reason: str,
    ) -> AttendanceCorrection:
        correction = AttendanceCorrection(
            attendance_id=attendance_id,
            corrected_by=corrected_by,
            old_status=old_status,
            new_status=new_status,
            reason=reason,
            corrected_at=datetime.now(timezone.utc),
        )
        self.session.add(correction)
        record = await self.session.get(AttendanceRecord, attendance_id)
        if record and "corrections" in record.__dict__:
            record.corrections.append(correction)
        await self.session.flush()
        return correction

    # ---------------------------------------------------------------------------
    # Gym Card Token Verification / Storage
    # ---------------------------------------------------------------------------

    async def register_token(
        self,
        student_id: uuid.UUID,
        allocation_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
        session_id: Optional[uuid.UUID] = None,
    ) -> GymCardToken:
        token = GymCardToken(
            student_id=student_id,
            allocation_id=allocation_id,
            token_hash=token_hash,
            expires_at=expires_at,
            session_id=session_id,
        )
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_token_by_hash(self, token_hash: str) -> Optional[GymCardToken]:
        stmt = select(GymCardToken).where(GymCardToken.token_hash == token_hash)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_token(self, token_hash: str) -> bool:
        stmt = (
            update(GymCardToken)
            .where(GymCardToken.token_hash == token_hash)
            .values(revoked_at=datetime.now(timezone.utc))
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0

    # ---------------------------------------------------------------------------
    # Exemptions
    # ---------------------------------------------------------------------------

    async def create_exemption(
        self,
        session_id: uuid.UUID,
        student_id: uuid.UUID,
        reason: str,
        created_by: uuid.UUID,
    ) -> AttendanceExemption:
        exemption = AttendanceExemption(
            session_id=session_id,
            student_id=student_id,
            reason=reason,
            created_by=created_by,
        )
        self.session.add(exemption)
        await self.session.flush()
        return exemption

    async def get_exemption(
        self,
        student_id: uuid.UUID,
        session_id: uuid.UUID,
    ) -> Optional[AttendanceExemption]:
        stmt = select(AttendanceExemption).where(
            AttendanceExemption.student_id == student_id,
            AttendanceExemption.session_id == session_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_exemption_by_id(self, exemption_id: uuid.UUID) -> Optional[AttendanceExemption]:
        stmt = select(AttendanceExemption).where(AttendanceExemption.id == exemption_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_exemptions(
        self,
        student_id: Optional[uuid.UUID] = None,
        session_id: Optional[uuid.UUID] = None,
    ) -> List[AttendanceExemption]:
        conditions = []
        if student_id is not None:
            conditions.append(AttendanceExemption.student_id == student_id)
        if session_id is not None:
            conditions.append(AttendanceExemption.session_id == session_id)

        stmt = select(AttendanceExemption)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = stmt.order_by(desc(AttendanceExemption.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_exemption(self, exemption_id: uuid.UUID) -> bool:
        stmt = delete(AttendanceExemption).where(AttendanceExemption.id == exemption_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0

    # ---------------------------------------------------------------------------
    # Absence Policy
    # ---------------------------------------------------------------------------

    async def get_active_policy(self) -> Optional[AbsencePolicy]:
        stmt = (
            select(AbsencePolicy)
            .where(AbsencePolicy.is_active == True)  # noqa: E712
            .order_by(desc(AbsencePolicy.created_at))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def set_active_policy(
        self,
        threshold: int,
        updated_by: uuid.UUID,
    ) -> AbsencePolicy:
        # Deactivate current active policies
        await self.session.execute(
            update(AbsencePolicy)
            .where(AbsencePolicy.is_active == True)  # noqa: E712
            .values(is_active=False, effective_until=datetime.now(timezone.utc))
        )
        policy = AbsencePolicy(
            consecutive_absence_threshold=threshold,
            is_active=True,
            updated_by=updated_by,
        )
        self.session.add(policy)
        await self.session.flush()
        return policy

    # ---------------------------------------------------------------------------
    # Monitoring queries
    # ---------------------------------------------------------------------------

    async def get_distinct_student_ids(self) -> List[uuid.UUID]:
        stmt = select(AttendanceRecord.student_id).distinct()
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
