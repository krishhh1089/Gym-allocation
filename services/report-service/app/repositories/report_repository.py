import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.report import (
    AuditLog,
    Report,
    ReportFormat,
    ReportJob,
    ReportJobStatus,
    ReportStatus,
    ReportType,
)


class ReportRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ---------------------------------------------------------------------------
    # Reports
    # ---------------------------------------------------------------------------

    async def create_report(
        self,
        name: str,
        type: ReportType,
        format: ReportFormat,
        created_by: uuid.UUID,
        parameters: Optional[Dict[str, Any]] = None,
        file_ref: Optional[str] = None,
        status: ReportStatus = ReportStatus.PENDING,
    ) -> Report:
        params_json = json.dumps(parameters) if parameters else None
        report = Report(
            name=name,
            type=type,
            format=format,
            created_by=created_by,
            parameters=params_json,
            file_ref=file_ref,
            status=status,
        )
        self.session.add(report)
        await self.session.flush()
        return report

    async def get_report_by_id(self, report_id: uuid.UUID) -> Optional[Report]:
        stmt = (
            select(Report)
            .options(selectinload(Report.jobs))
            .where(Report.id == report_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_reports(
        self,
        type: Optional[ReportType] = None,
        status: Optional[ReportStatus] = None,
        created_by: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Report], int]:
        conditions = []
        if type is not None:
            conditions.append(Report.type == type)
        if status is not None:
            conditions.append(Report.status == status)
        if created_by is not None:
            conditions.append(Report.created_by == created_by)

        count_stmt = select(func.count(Report.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(Report)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(Report.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def update_report(
        self,
        report_id: uuid.UUID,
        status: ReportStatus,
        file_ref: Optional[str] = None,
        completed_at: Optional[datetime] = None,
    ) -> Optional[Report]:
        report = await self.get_report_by_id(report_id)
        if not report:
            return None
        report.status = status
        if file_ref is not None:
            report.file_ref = file_ref
        if completed_at is not None:
            report.completed_at = completed_at
        elif status == ReportStatus.COMPLETED and report.completed_at is None:
            report.completed_at = datetime.now(timezone.utc)
        await self.session.flush()
        return report

    async def delete_report(self, report_id: uuid.UUID) -> bool:
        stmt = delete(Report).where(Report.id == report_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount > 0

    # ---------------------------------------------------------------------------
    # Report Jobs
    # ---------------------------------------------------------------------------

    async def create_job(self, report_id: uuid.UUID) -> ReportJob:
        job = ReportJob(
            report_id=report_id,
            status=ReportJobStatus.QUEUED,
        )
        self.session.add(job)
        report = await self.session.get(Report, report_id)
        if report and "jobs" in report.__dict__:
            report.jobs.append(job)
        await self.session.flush()
        return job

    async def get_job_by_id(self, job_id: uuid.UUID) -> Optional[ReportJob]:
        stmt = select(ReportJob).where(ReportJob.id == job_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    # ---------------------------------------------------------------------------
    # Audit Logs
    # ---------------------------------------------------------------------------

    async def record_audit_log(
        self,
        actor_id: uuid.UUID,
        action: str,
        target_type: str,
        target_id: str,
        before_state: Optional[str] = None,
        after_state: Optional[str] = None,
        reason: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> AuditLog:
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            before_state=before_state,
            after_state=after_state,
            reason=reason,
            correlation_id=correlation_id,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(log)
        await self.session.flush()
        return log

    async def get_audit_log_by_id(self, audit_id: uuid.UUID) -> Optional[AuditLog]:
        stmt = select(AuditLog).where(AuditLog.id == audit_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_audit_logs(
        self,
        actor_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[AuditLog], int]:
        conditions = []
        if actor_id is not None:
            conditions.append(AuditLog.actor_id == actor_id)
        if action is not None:
            conditions.append(AuditLog.action == action)
        if target_type is not None:
            conditions.append(AuditLog.target_type == target_type)
        if date_from is not None:
            conditions.append(AuditLog.created_at >= date_from)
        if date_to is not None:
            conditions.append(AuditLog.created_at <= date_to)

        count_stmt = select(func.count(AuditLog.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(AuditLog)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(AuditLog.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total
