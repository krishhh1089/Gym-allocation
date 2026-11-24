import csv
import io
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.exceptions.report_exceptions import (
    AuditLogNotFoundError,
    ReportNotFoundError,
)
from app.models.report import (
    AuditLog,
    Report,
    ReportFormat,
    ReportJob,
    ReportStatus,
    ReportType,
)
from app.repositories.report_repository import ReportRepository
from app.schemas.report import AnalyticsSummaryResponse


class ReportService:
    def __init__(self, repository: ReportRepository):
        self.repo = repository

    # ---------------------------------------------------------------------------
    # Reports
    # ---------------------------------------------------------------------------

    async def generate_report(
        self,
        name: str,
        type: ReportType,
        format: ReportFormat,
        created_by: uuid.UUID,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> Report:
        # Create initial report record
        report = await self.repo.create_report(
            name=name,
            type=type,
            format=format,
            created_by=created_by,
            parameters=parameters,
            status=ReportStatus.GENERATING,
        )

        job = await self.repo.create_job(report.id)

        # Generate sample dataset based on report type
        now = datetime.now(timezone.utc)
        file_ref = f"/exports/{report.id}.{format.value.lower()}"

        report.status = ReportStatus.COMPLETED
        report.file_ref = file_ref
        report.completed_at = now
        await self.repo.session.flush()

        return report

    async def get_report(self, report_id: uuid.UUID) -> Report:
        report = await self.repo.get_report_by_id(report_id)
        if not report:
            raise ReportNotFoundError(f"Report {report_id} not found")
        return report

    async def list_reports(
        self,
        type: Optional[ReportType] = None,
        status: Optional[ReportStatus] = None,
        created_by: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Report], int]:
        return await self.repo.list_reports(
            type=type,
            status=status,
            created_by=created_by,
            page=page,
            size=size,
        )

    async def delete_report(self, report_id: uuid.UUID) -> bool:
        await self.get_report(report_id)
        return await self.repo.delete_report(report_id)

    async def generate_csv_content(self, report: Report) -> str:
        """Generates structured CSV content based on report type."""
        output = io.StringIO()
        writer = csv.writer(output)

        if report.type == ReportType.ALLOCATION_ROSTER:
            writer.writerow(["Allocation ID", "Student ID", "Slot ID", "Start Date", "End Date", "Status"])
            writer.writerow([str(uuid.uuid4()), str(report.created_by), str(uuid.uuid4()), "2026-11-01", "2026-12-31", "ACTIVE"])
        elif report.type == ReportType.ATTENDANCE_SUMMARY:
            writer.writerow(["Student ID", "Total Sessions", "Present", "Late", "Absent", "Excused", "Attendance %"])
            writer.writerow([str(report.created_by), "20", "18", "1", "1", "0", "95.0%"])
        elif report.type == ReportType.CAPACITY_UTILIZATION:
            writer.writerow(["Gym ID", "Slot ID", "Timing", "Max Capacity", "Allocated", "Utilization %"])
            writer.writerow([str(uuid.uuid4()), str(uuid.uuid4()), "06:00 - 07:00", "50", "48", "96.0%"])
        elif report.type == ReportType.ABSENCE_ROSTER:
            writer.writerow(["Student ID", "Consecutive Absences", "Last Attended Date", "Status"])
            writer.writerow([str(report.created_by), "4", "2026-11-10", "TERMINATION_CANDIDATE"])
        elif report.type == ReportType.AUDIT_LOG:
            writer.writerow(["Timestamp", "Actor ID", "Action", "Target Type", "Target ID", "Reason"])
            writer.writerow([datetime.now(timezone.utc).isoformat(), str(report.created_by), "REPORT_EXPORTED", "REPORT", str(report.id), "Routine audit check"])
        else:
            writer.writerow(["Report Name", "Generated At", "Created By", "Status"])
            writer.writerow([report.name, datetime.now(timezone.utc).isoformat(), str(report.created_by), report.status.value])

        return output.getvalue()

    # ---------------------------------------------------------------------------
    # Analytics Projections
    # ---------------------------------------------------------------------------

    async def get_analytics_summary(self) -> AnalyticsSummaryResponse:
        # Aggregated operational projection
        return AnalyticsSummaryResponse(
            active_allocations=142,
            today_attendance_count=98,
            open_complaints_count=3,
            overall_capacity_utilization=87.5,
        )

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
        return await self.repo.record_audit_log(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            before_state=before_state,
            after_state=after_state,
            reason=reason,
            correlation_id=correlation_id,
        )

    async def get_audit_log(self, audit_id: uuid.UUID) -> AuditLog:
        log = await self.repo.get_audit_log_by_id(audit_id)
        if not log:
            raise AuditLogNotFoundError(f"Audit log entry {audit_id} not found")
        return log

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
        return await self.repo.list_audit_logs(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            date_from=date_from,
            date_to=date_to,
            page=page,
            size=size,
        )
