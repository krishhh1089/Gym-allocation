"""
Unit tests for ReportService domain operations.
"""

import uuid
from datetime import datetime, timezone
import pytest

from app.exceptions.report_exceptions import (
    AuditLogNotFoundError,
    ReportNotFoundError,
)
from app.models.report import ReportFormat, ReportStatus, ReportType
from app.repositories.report_repository import ReportRepository
from app.services.report_service import ReportService


@pytest.fixture
def report_service(db_session):
    repo = ReportRepository(db_session)
    return ReportService(repo)


@pytest.mark.asyncio
async def test_generate_report_allocation_roster(report_service: ReportService, admin_user_id: uuid.UUID):
    report = await report_service.generate_report(
        name="Fall 2026 Allocation Roster",
        type=ReportType.ALLOCATION_ROSTER,
        format=ReportFormat.CSV,
        created_by=admin_user_id,
        parameters={"semester": "Fall 2026"},
    )
    assert report.id is not None
    assert report.name == "Fall 2026 Allocation Roster"
    assert report.type == ReportType.ALLOCATION_ROSTER
    assert report.format == ReportFormat.CSV
    assert report.status == ReportStatus.COMPLETED
    assert report.file_ref.endswith(".csv")


@pytest.mark.asyncio
async def test_generate_csv_content_variants(report_service: ReportService, admin_user_id: uuid.UUID):
    types = [
        ReportType.ALLOCATION_ROSTER,
        ReportType.ATTENDANCE_SUMMARY,
        ReportType.CAPACITY_UTILIZATION,
        ReportType.ABSENCE_ROSTER,
        ReportType.AUDIT_LOG,
    ]
    for r_type in types:
        report = await report_service.generate_report(
            name=f"Test {r_type.value}",
            type=r_type,
            format=ReportFormat.CSV,
            created_by=admin_user_id,
        )
        csv_data = await report_service.generate_csv_content(report)
        assert isinstance(csv_data, str)
        assert len(csv_data) > 0


@pytest.mark.asyncio
async def test_get_report_and_not_found(report_service: ReportService, admin_user_id: uuid.UUID):
    report = await report_service.generate_report(
        name="Attendance Report",
        type=ReportType.ATTENDANCE_SUMMARY,
        format=ReportFormat.CSV,
        created_by=admin_user_id,
    )
    fetched = await report_service.get_report(report.id)
    assert fetched.id == report.id

    with pytest.raises(ReportNotFoundError):
        await report_service.get_report(uuid.uuid4())


@pytest.mark.asyncio
async def test_list_reports_filter_and_pagination(report_service: ReportService, admin_user_id: uuid.UUID):
    for i in range(3):
        await report_service.generate_report(
            name=f"Report {i}",
            type=ReportType.ALLOCATION_ROSTER,
            format=ReportFormat.CSV,
            created_by=admin_user_id,
        )

    reports, total = await report_service.list_reports(type=ReportType.ALLOCATION_ROSTER, page=1, size=2)
    assert total >= 3
    assert len(reports) == 2


@pytest.mark.asyncio
async def test_delete_report(report_service: ReportService, admin_user_id: uuid.UUID):
    report = await report_service.generate_report(
        name="To Delete",
        type=ReportType.CAPACITY_UTILIZATION,
        format=ReportFormat.CSV,
        created_by=admin_user_id,
    )
    deleted = await report_service.delete_report(report.id)
    assert deleted is True

    with pytest.raises(ReportNotFoundError):
        await report_service.get_report(report.id)

    with pytest.raises(ReportNotFoundError):
        await report_service.delete_report(uuid.uuid4())


@pytest.mark.asyncio
async def test_analytics_summary_projection(report_service: ReportService):
    summary = await report_service.get_analytics_summary()
    assert summary.active_allocations >= 0
    assert summary.today_attendance_count >= 0
    assert summary.overall_capacity_utilization >= 0.0


@pytest.mark.asyncio
async def test_record_and_query_audit_logs(report_service: ReportService, admin_user_id: uuid.UUID):
    target_id = str(uuid.uuid4())
    log = await report_service.record_audit_log(
        actor_id=admin_user_id,
        action="UPDATE_SLOT_CAPACITY",
        target_type="SLOT",
        target_id=target_id,
        before_state='{"capacity": 40}',
        after_state='{"capacity": 50}',
        reason="Increased evening demand",
        correlation_id="corr-123",
    )
    assert log.id is not None
    assert log.actor_id == admin_user_id
    assert log.action == "UPDATE_SLOT_CAPACITY"

    fetched = await report_service.get_audit_log(log.id)
    assert fetched.id == log.id

    logs, total = await report_service.list_audit_logs(actor_id=admin_user_id, action="UPDATE_SLOT_CAPACITY")
    assert total >= 1
    assert any(l.id == log.id for l in logs)

    with pytest.raises(AuditLogNotFoundError):
        await report_service.get_audit_log(uuid.uuid4())
