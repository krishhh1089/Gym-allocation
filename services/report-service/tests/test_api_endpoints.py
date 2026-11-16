"""
Integration tests for Report Service API endpoints.
"""

import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "report-service"


@pytest.mark.asyncio
async def test_create_report_as_admin(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Weekly Attendance Summary",
        "type": "ATTENDANCE_SUMMARY",
        "format": "CSV",
        "parameters": {"week": 46},
    }
    resp = await async_client.post("/reports", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Weekly Attendance Summary"
    assert data["type"] == "ATTENDANCE_SUMMARY"
    assert data["status"] == "COMPLETED"
    assert data["file_ref"] is not None


@pytest.mark.asyncio
async def test_create_report_forbidden_for_student(async_client: AsyncClient, student_token: str):
    headers = {"Authorization": f"Bearer {student_token}"}
    payload = {
        "name": "Unauthorized Report",
        "type": "ALLOCATION_ROSTER",
        "format": "CSV",
    }
    resp = await async_client.post("/reports", json=payload, headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_and_get_report(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Create report
    create_resp = await async_client.post(
        "/reports",
        json={"name": "Audit Log Export", "type": "AUDIT_LOG", "format": "CSV"},
        headers=headers,
    )
    assert create_resp.status_code == 201
    report_id = create_resp.json()["id"]

    # List reports
    list_resp = await async_client.get("/reports", headers=headers)
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
    assert any(r["id"] == report_id for r in list_data["items"])

    # Get report detail
    get_resp = await async_client.get(f"/reports/{report_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == report_id


@pytest.mark.asyncio
async def test_download_report_csv(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/reports",
        json={"name": "Slot Capacity Export", "type": "CAPACITY_UTILIZATION", "format": "CSV"},
        headers=headers,
    )
    assert create_resp.status_code == 201
    report_id = create_resp.json()["id"]

    download_resp = await async_client.get(f"/reports/{report_id}/download", headers=headers)
    assert download_resp.status_code == 200
    assert download_resp.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=" in download_resp.headers.get("content-disposition", "")
    assert "Gym ID" in download_resp.text


@pytest.mark.asyncio
async def test_delete_report(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/reports",
        json={"name": "Temporary Report", "type": "ABSENCE_ROSTER", "format": "CSV"},
        headers=headers,
    )
    report_id = create_resp.json()["id"]

    del_resp = await async_client.delete(f"/reports/{report_id}", headers=headers)
    assert del_resp.status_code == 204

    get_resp = await async_client.get(f"/reports/{report_id}", headers=headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_analytics_summary(async_client: AsyncClient, trainer_token: str, student_token: str):
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    resp = await async_client.get("/analytics/summary", headers=trainer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "active_allocations" in data
    assert "today_attendance_count" in data
    assert "overall_capacity_utilization" in data

    # Forbidden for student
    student_headers = {"Authorization": f"Bearer {student_token}"}
    forbidden_resp = await async_client.get("/analytics/summary", headers=student_headers)
    assert forbidden_resp.status_code == 403


@pytest.mark.asyncio
async def test_audit_logs_lifecycle(async_client: AsyncClient, admin_token: str, admin_user_id: uuid.UUID):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "actor_id": str(admin_user_id),
        "action": "REVOKE_ALLOCATION",
        "target_type": "ALLOCATION",
        "target_id": str(uuid.uuid4()),
        "before_state": "ACTIVE",
        "after_state": "REVOKED",
        "reason": "Consecutive unauthorized absences",
    }
    create_resp = await async_client.post("/audit-logs", json=payload, headers=headers)
    assert create_resp.status_code == 201
    log_id = create_resp.json()["id"]

    # List audit logs
    list_resp = await async_client.get("/audit-logs", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    # Get single audit log
    get_resp = await async_client.get(f"/audit-logs/{log_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["action"] == "REVOKE_ALLOCATION"
