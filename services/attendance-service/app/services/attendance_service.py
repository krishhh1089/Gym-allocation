import hashlib
import uuid
from datetime import date, datetime, timezone
from typing import List, Optional, Tuple

from app.config import settings
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
from app.repositories.attendance_repository import AttendanceRepository
from app.schemas.attendance import (
    AbsenceCandidateResponse,
    AttendanceSummaryResponse,
    ScanOutcomeResponse,
)


class AttendanceService:
    def __init__(self, repository: AttendanceRepository):
        self.repo = repository

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
        if starts_at >= ends_at:
            raise ValueError("starts_at must be strictly before ends_at")

        existing = await self.repo.get_session_by_slot_and_date(slot_id, session_date)
        if existing:
            return existing

        return await self.repo.create_session(
            slot_id=slot_id,
            session_date=session_date,
            starts_at=starts_at,
            ends_at=ends_at,
        )

    async def get_session(self, session_id: uuid.UUID) -> AttendanceSession:
        session_obj = await self.repo.get_session_by_id(session_id)
        if not session_obj:
            raise AttendanceSessionNotFoundError(f"Session {session_id} not found")
        return session_obj

    async def list_sessions(
        self,
        slot_id: Optional[uuid.UUID] = None,
        session_date: Optional[date] = None,
        status: Optional[SessionStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[AttendanceSession], int]:
        return await self.repo.list_sessions(
            slot_id=slot_id,
            session_date=session_date,
            status=status,
            page=page,
            size=size,
        )

    async def get_today_sessions(self, target_date: Optional[date] = None) -> List[AttendanceSession]:
        if target_date is None:
            target_date = datetime.now(timezone.utc).date()
        return await self.repo.get_today_sessions(target_date)

    async def update_session_status(
        self,
        session_id: uuid.UUID,
        status: SessionStatus,
    ) -> AttendanceSession:
        session_obj = await self.repo.get_session_by_id(session_id)
        if not session_obj:
            raise AttendanceSessionNotFoundError(f"Session {session_id} not found")
        updated = await self.repo.update_session_status(session_id, status)
        return updated  # type: ignore

    # ---------------------------------------------------------------------------
    # QR Scan Attendance Check-in
    # ---------------------------------------------------------------------------

    async def process_qr_scan(
        self,
        raw_token: str,
        session_id: uuid.UUID,
        student_id: uuid.UUID,
        allocation_id: uuid.UUID,
        staff_id: uuid.UUID,
        now: Optional[datetime] = None,
    ) -> Tuple[ScanOutcomeResponse, AttendanceRecord]:
        if now is None:
            now = datetime.now(timezone.utc)
        elif now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        session_obj = await self.repo.get_session_by_id(session_id)
        if not session_obj:
            raise AttendanceSessionNotFoundError(f"Session {session_id} not found")

        if session_obj.status == SessionStatus.CANCELLED:
            raise SessionCancelledError("Cannot check in to a cancelled session")

        # Check-in time window validation
        if not session_obj.is_check_in_open(
            now,
            before_min=settings.check_in_window_minutes_before,
            after_min=settings.check_in_window_minutes_after,
        ):
            raise SessionNotOpenError("Check-in window is currently closed for this session")

        # Duplicate check-in verification
        existing_record = await self.repo.get_record_by_student_and_session(student_id, session_id)
        if existing_record:
            if existing_record.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE):
                raise DuplicateAttendanceError("Student has already checked in for this session")

        # Token verification (if token was registered in DB)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        token_record = await self.repo.get_token_by_hash(token_hash)
        if token_record:
            if not token_record.is_valid(now):
                raise InvalidTokenError("QR token has expired or been revoked")
            if token_record.student_id != student_id or token_record.allocation_id != allocation_id:
                raise InvalidTokenError("QR token does not match student or allocation")

        # Determine attendance status (LATE vs PRESENT)
        status = AttendanceStatus.PRESENT
        if session_obj.is_late(now, late_grace_min=settings.check_in_window_minutes_before):
            status = AttendanceStatus.LATE

        # Check if student was previously granted an exemption
        exemption = await self.repo.get_exemption(student_id, session_id)
        if exemption:
            status = AttendanceStatus.EXCUSED

        # Record attendance
        if existing_record:
            # Update existing absent/pending record
            existing_record.status = status
            existing_record.check_in_time = now
            existing_record.method = CheckInMethod.QR_SCAN
            existing_record.staff_id = staff_id
            await self.repo.session.flush()
            record = existing_record
        else:
            record = await self.repo.create_record(
                student_id=student_id,
                allocation_id=allocation_id,
                session_id=session_id,
                session_date=session_obj.session_date,
                status=status,
                check_in_time=now,
                method=CheckInMethod.QR_SCAN,
                staff_id=staff_id,
            )

        # Invalidate/revoke token if registered
        if token_record:
            await self.repo.revoke_token(token_hash)

        outcome = ScanOutcomeResponse(
            outcome="VALID_AND_ELIGIBLE",
            message=f"Attendance successfully recorded as {status.value}",
        )
        return outcome, record

    # ---------------------------------------------------------------------------
    # Manual Fallback Attendance Check-in
    # ---------------------------------------------------------------------------

    async def process_manual_attendance(
        self,
        session_id: uuid.UUID,
        student_id: uuid.UUID,
        allocation_id: uuid.UUID,
        staff_id: uuid.UUID,
        status: AttendanceStatus = AttendanceStatus.PRESENT,
        reason: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> AttendanceRecord:
        if now is None:
            now = datetime.now(timezone.utc)
        elif now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        session_obj = await self.repo.get_session_by_id(session_id)
        if not session_obj:
            raise AttendanceSessionNotFoundError(f"Session {session_id} not found")

        if session_obj.status == SessionStatus.CANCELLED:
            raise SessionCancelledError("Cannot check in to a cancelled session")

        existing_record = await self.repo.get_record_by_student_and_session(student_id, session_id)
        if existing_record:
            if existing_record.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE):
                raise DuplicateAttendanceError("Student has already checked in for this session")
            # Update existing record
            old_status = existing_record.status.value
            existing_record.status = status
            existing_record.check_in_time = now
            existing_record.method = CheckInMethod.MANUAL_FALLBACK
            existing_record.staff_id = staff_id
            await self.repo.session.flush()

            if reason:
                await self.repo.add_correction(
                    attendance_id=existing_record.id,
                    corrected_by=staff_id,
                    old_status=old_status,
                    new_status=status.value,
                    reason=f"Manual check-in fallback: {reason}",
                )
            return existing_record

        record = await self.repo.create_record(
            student_id=student_id,
            allocation_id=allocation_id,
            session_id=session_id,
            session_date=session_obj.session_date,
            status=status,
            check_in_time=now,
            method=CheckInMethod.MANUAL_FALLBACK,
            staff_id=staff_id,
        )

        if reason:
            await self.repo.add_correction(
                attendance_id=record.id,
                corrected_by=staff_id,
                old_status="NEW",
                new_status=status.value,
                reason=f"Manual check-in fallback: {reason}",
            )

        return record

    # ---------------------------------------------------------------------------
    # Attendance Records & Queries
    # ---------------------------------------------------------------------------

    async def get_record(self, record_id: uuid.UUID) -> AttendanceRecord:
        record = await self.repo.get_record_by_id(record_id)
        if not record:
            raise AttendanceRecordNotFoundError(f"Attendance record {record_id} not found")
        return record

    async def list_records(
        self,
        student_id: Optional[uuid.UUID] = None,
        session_id: Optional[uuid.UUID] = None,
        session_date: Optional[date] = None,
        status: Optional[AttendanceStatus] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[AttendanceRecord], int]:
        return await self.repo.list_records(
            student_id=student_id,
            session_id=session_id,
            session_date=session_date,
            status=status,
            page=page,
            size=size,
        )

    async def get_session_roster(self, session_id: uuid.UUID) -> List[AttendanceRecord]:
        session_obj = await self.repo.get_session_by_id(session_id)
        if not session_obj:
            raise AttendanceSessionNotFoundError(f"Session {session_id} not found")
        return await self.repo.list_records_for_session(session_id)

    # ---------------------------------------------------------------------------
    # Attendance Corrections (Audit logged)
    # ---------------------------------------------------------------------------

    async def correct_attendance(
        self,
        attendance_id: uuid.UUID,
        new_status: AttendanceStatus,
        reason: str,
        corrected_by: uuid.UUID,
    ) -> Tuple[AttendanceRecord, AttendanceCorrection]:
        record = await self.repo.get_record_by_id(attendance_id)
        if not record:
            raise AttendanceRecordNotFoundError(f"Attendance record {attendance_id} not found")

        old_status = record.status.value
        if old_status == new_status.value:
            raise AttendanceCorrectionError("New status must be different from current status")

        record.status = new_status
        await self.repo.session.flush()

        correction = await self.repo.add_correction(
            attendance_id=record.id,
            corrected_by=corrected_by,
            old_status=old_status,
            new_status=new_status.value,
            reason=reason,
        )
        return record, correction

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
        session_obj = await self.repo.get_session_by_id(session_id)
        if not session_obj:
            raise AttendanceSessionNotFoundError(f"Session {session_id} not found")

        existing = await self.repo.get_exemption(student_id, session_id)
        if existing:
            raise ExemptionAlreadyExistsError("Exemption already granted for this student and session")

        exemption = await self.repo.create_exemption(
            session_id=session_id,
            student_id=student_id,
            reason=reason,
            created_by=created_by,
        )

        # If attendance record exists, update to EXCUSED with audit correction
        record = await self.repo.get_record_by_student_and_session(student_id, session_id)
        if record and record.status != AttendanceStatus.EXCUSED:
            old_status = record.status.value
            record.status = AttendanceStatus.EXCUSED
            await self.repo.session.flush()
            await self.repo.add_correction(
                attendance_id=record.id,
                corrected_by=created_by,
                old_status=old_status,
                new_status=AttendanceStatus.EXCUSED.value,
                reason=f"Exemption granted: {reason}",
            )

        return exemption

    async def delete_exemption(self, exemption_id: uuid.UUID) -> bool:
        exemption = await self.repo.get_exemption_by_id(exemption_id)
        if not exemption:
            raise ExemptionNotFoundError(f"Exemption {exemption_id} not found")
        return await self.repo.delete_exemption(exemption_id)

    async def list_exemptions(
        self,
        student_id: Optional[uuid.UUID] = None,
        session_id: Optional[uuid.UUID] = None,
    ) -> List[AttendanceExemption]:
        return await self.repo.list_exemptions(student_id=student_id, session_id=session_id)

    # ---------------------------------------------------------------------------
    # Attendance Summary & Statistics
    # ---------------------------------------------------------------------------

    async def get_student_summary(self, student_id: uuid.UUID) -> AttendanceSummaryResponse:
        records = await self.repo.get_student_records(student_id)
        total = len(records)
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
        absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        excused = sum(1 for r in records if r.status == AttendanceStatus.EXCUSED)

        attending = present + late
        effective_sessions = total - excused
        percentage = round((attending / effective_sessions * 100.0), 2) if effective_sessions > 0 else 0.0

        # Calculate consecutive unexcused absences (ordered by date desc)
        consecutive_absences = 0
        for r in records:
            if r.status == AttendanceStatus.ABSENT:
                consecutive_absences += 1
            elif r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE):
                break
            # EXCUSED or INVALIDATED does not break streak or count against, but skip

        return AttendanceSummaryResponse(
            student_id=student_id,
            total_sessions=total,
            present_count=present,
            late_count=late,
            absent_count=absent,
            excused_count=excused,
            attendance_percentage=percentage,
            consecutive_absences=consecutive_absences,
        )

    # ---------------------------------------------------------------------------
    # Absence Policy & Monitoring
    # ---------------------------------------------------------------------------

    async def get_active_policy(self) -> AbsencePolicy:
        policy = await self.repo.get_active_policy()
        if not policy:
            now = datetime.now(timezone.utc)
            # Fall back to default
            policy = AbsencePolicy(
                id=uuid.uuid4(),
                consecutive_absence_threshold=settings.consecutive_absence_threshold,
                effective_from=now,
                is_active=True,
                updated_by=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                created_at=now,
                updated_at=now,
            )
        return policy

    async def update_policy(self, threshold: int, updated_by: uuid.UUID) -> AbsencePolicy:
        return await self.repo.set_active_policy(threshold=threshold, updated_by=updated_by)

    async def get_absence_candidates(self) -> List[AbsenceCandidateResponse]:
        policy = await self.get_active_policy()
        threshold = policy.consecutive_absence_threshold
        warning_level = max(1, threshold - 1)

        student_ids = await self.repo.get_distinct_student_ids()
        candidates: List[AbsenceCandidateResponse] = []

        for student_id in student_ids:
            summary = await self.get_student_summary(student_id)
            if summary.consecutive_absences >= warning_level:
                status = (
                    "TERMINATION_CANDIDATE"
                    if summary.consecutive_absences >= threshold
                    else "WARNING"
                )
                # Find last attended date
                records = await self.repo.get_student_records(student_id)
                last_attended = None
                for r in records:
                    if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE):
                        last_attended = r.session_date
                        break

                candidates.append(
                    AbsenceCandidateResponse(
                        student_id=student_id,
                        consecutive_absences=summary.consecutive_absences,
                        last_attended_date=last_attended,
                        status=status,
                    )
                )

        return candidates

    # ---------------------------------------------------------------------------
    # Gym Card Token Registration
    # ---------------------------------------------------------------------------

    async def register_token(
        self,
        student_id: uuid.UUID,
        allocation_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
        session_id: Optional[uuid.UUID] = None,
    ) -> GymCardToken:
        return await self.repo.register_token(
            student_id=student_id,
            allocation_id=allocation_id,
            token_hash=token_hash,
            expires_at=expires_at,
            session_id=session_id,
        )
