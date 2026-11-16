"""
API endpoint and integration tests for Attendance Service.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
from httpx import AsyncClient

from app.models.attendance import AttendanceStatus, CheckInMethod, GymCardToken, SessionStatus


@pytest.mark.asyncio
async def test_health_endpoint(async_client: AsyncClient):
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "attendance-service"


@pytest.mark.asyncio
async def test_session_lifecycle_and_rbac(
    async_client: AsyncClient,
    admin_token: str,
    trainer_token: str,
    student_token: str,
):
    slot_id = str(uuid.uuid4())
    today = str(datetime.now(timezone.utc).date())
    now = datetime.now(timezone.utc)
    starts = (now + timedelta(hours=1)).isoformat()
    ends = (now + timedelta(hours=2)).isoformat()

    payload = {
        "slot_id": slot_id,
        "session_date": today,
        "starts_at": starts,
        "ends_at": ends,
    }

    # 1. Student cannot create session (403)
    resp = await async_client.post(
        "/sessions",
        json=payload,
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # 2. Admin can create session (201)
    resp = await async_client.post(
        "/sessions",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    session_data = resp.json()
    session_id = session_data["id"]
    assert session_data["slot_id"] == slot_id
    assert session_data["status"] == "SCHEDULED"

    # 3. List sessions
    resp = await async_client.get(
        "/sessions",
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 4. Get session by ID
    resp = await async_client.get(
        f"/sessions/{session_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == session_id

    # 5. Trainer can update status to COMPLETED
    resp = await async_client.patch(
        f"/sessions/{session_id}/status",
        json={"status": "COMPLETED"},
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_qr_scan_and_manual_checkin_endpoints(
    async_client: AsyncClient,
    admin_token: str,
    trainer_token: str,
    student_token: str,
    student_user_id: uuid.UUID,
):
    slot_id = str(uuid.uuid4())
    today = str(datetime.now(timezone.utc).date())
    now = datetime.now(timezone.utc)
    starts = (now - timedelta(minutes=5)).isoformat()
    ends = (now + timedelta(minutes=45)).isoformat()

    # Create session as Admin
    resp = await async_client.post(
        "/sessions",
        json={
            "slot_id": slot_id,
            "session_date": today,
            "starts_at": starts,
            "ends_at": ends,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    session_id = resp.json()["id"]

    alloc_id = str(uuid.uuid4())
    raw_token = "valid-qr-card-token"
    token_hash = GymCardToken.hash_raw_token(raw_token)

    # Register token hash
    reg_resp = await async_client.post(
        "/tokens/register",
        json={
            "student_id": str(student_user_id),
            "allocation_id": alloc_id,
            "token_hash": token_hash,
            "expires_at": (now + timedelta(minutes=15)).isoformat(),
            "session_id": session_id,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reg_resp.status_code == 201

    # Student cannot scan QR codes (403)
    resp = await async_client.post(
        "/attendance/scan",
        json={
            "raw_token": raw_token,
            "session_id": session_id,
            "student_id": str(student_user_id),
            "allocation_id": alloc_id,
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # Trainer scans QR code (200)
    resp = await async_client.post(
        "/attendance/scan",
        json={
            "raw_token": raw_token,
            "session_id": session_id,
            "student_id": str(student_user_id),
            "allocation_id": alloc_id,
        },
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    outcome = resp.json()
    assert outcome["outcome"] == "VALID_AND_ELIGIBLE"
    assert outcome["attendance"]["status"] == "PRESENT"
    record_id = outcome["attendance"]["id"]

    # Duplicate scan is rejected (409)
    resp = await async_client.post(
        "/attendance/scan",
        json={
            "raw_token": raw_token,
            "session_id": session_id,
            "student_id": str(student_user_id),
            "allocation_id": alloc_id,
        },
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 409

    # Check session roster
    resp = await async_client.get(
        f"/sessions/{session_id}/roster",
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_manual_checkin_and_correction_flow(
    async_client: AsyncClient,
    admin_token: str,
    trainer_token: str,
    student_token: str,
):
    slot_id = str(uuid.uuid4())
    today = str(datetime.now(timezone.utc).date())
    now = datetime.now(timezone.utc)
    starts = (now - timedelta(minutes=5)).isoformat()
    ends = (now + timedelta(minutes=45)).isoformat()

    sess_resp = await async_client.post(
        "/sessions",
        json={
            "slot_id": slot_id,
            "session_date": today,
            "starts_at": starts,
            "ends_at": ends,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    session_id = sess_resp.json()["id"]

    student_id = str(uuid.uuid4())
    alloc_id = str(uuid.uuid4())

    # Manual check-in by Trainer
    resp = await async_client.post(
        "/attendance/manual",
        json={
            "session_id": session_id,
            "student_id": student_id,
            "allocation_id": alloc_id,
            "status": "PRESENT",
            "reason": "Camera broken at reception",
        },
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    record = resp.json()
    record_id = record["id"]
    assert record["method"] == "MANUAL_FALLBACK"

    # Trainer attempts to correct -> 403 Forbidden (Admin only)
    resp = await async_client.post(
        f"/attendance/{record_id}/correct",
        json={
            "new_status": "INVALIDATED",
            "reason": "Incorrect student AP entered",
        },
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 403

    # Admin corrects record -> 200 OK
    resp = await async_client.post(
        f"/attendance/{record_id}/correct",
        json={
            "new_status": "INVALIDATED",
            "reason": "Incorrect student AP entered",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    corrected = resp.json()
    assert corrected["status"] == "INVALIDATED"
    assert len(corrected["corrections"]) >= 1
    assert any(c["new_status"] == "INVALIDATED" for c in corrected["corrections"])


@pytest.mark.asyncio
async def test_student_self_access_and_isolation(
    async_client: AsyncClient,
    student_token: str,
    student_user_id: uuid.UUID,
):
    other_student_id = str(uuid.uuid4())

    # Student accessing own summary (/attendance/me) -> 200
    resp = await async_client.get(
        "/attendance/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["student_id"] == str(student_user_id)

    # Student accessing own ID (/attendance/student/{student_user_id}) -> 200
    resp = await async_client.get(
        f"/attendance/student/{student_user_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200

    # Student attempting to access other student's ID -> 403 Forbidden
    resp = await async_client.get(
        f"/attendance/student/{other_student_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_exemptions_and_policies(
    async_client: AsyncClient,
    admin_token: str,
    trainer_token: str,
    student_token: str,
):
    slot_id = str(uuid.uuid4())
    today = str(datetime.now(timezone.utc).date())
    now = datetime.now(timezone.utc)
    starts = (now + timedelta(hours=1)).isoformat()
    ends = (now + timedelta(hours=2)).isoformat()

    sess_resp = await async_client.post(
        "/sessions",
        json={
            "slot_id": slot_id,
            "session_date": today,
            "starts_at": starts,
            "ends_at": ends,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    session_id = sess_resp.json()["id"]
    student_id = str(uuid.uuid4())

    # 1. Grant exemption (Admin)
    resp = await async_client.post(
        "/exemptions",
        json={
            "session_id": session_id,
            "student_id": student_id,
            "reason": "College Annual Cultural Day",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    exemption_id = resp.json()["id"]

    # 2. List exemptions (Trainer)
    resp = await async_client.get(
        "/exemptions",
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # 3. Delete exemption (Admin)
    resp = await async_client.delete(
        f"/exemptions/{exemption_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204

    # 4. Absence policy endpoints
    resp = await async_client.get(
        "/policies/absence",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200

    # Admin updates policy threshold
    resp = await async_client.put(
        "/policies/absence",
        json={"consecutive_absence_threshold": 3},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["consecutive_absence_threshold"] == 3

    # 5. Monitoring absence candidates
    resp = await async_client.get(
        "/monitoring/absence-candidates",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_authentication_guards(async_client: AsyncClient):
    # No auth header -> 401
    resp = await async_client.get("/sessions")
    assert resp.status_code == 401

    # Malformed token -> 401
    resp = await async_client.get(
        "/sessions",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert resp.status_code == 401
