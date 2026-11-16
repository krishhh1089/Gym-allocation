"""
API endpoint and integration tests for Complaint Service.
"""

import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(async_client: AsyncClient):
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "complaint-service"


@pytest.mark.asyncio
async def test_complaints_lifecycle_and_rbac(
    async_client: AsyncClient,
    admin_token: str,
    trainer_token: str,
    student_token: str,
    admin_user_id: uuid.UUID,
):
    # 1. Student submits a complaint (201)
    resp = await async_client.post(
        "/complaints",
        json={
            "category": "FACILITY",
            "title": "Air Conditioning not working",
            "description": "AC unit in cardio zone is blowing warm air.",
            "priority": "HIGH",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 201
    comp_data = resp.json()
    comp_id = comp_data["id"]
    assert comp_data["status"] == "OPEN"
    assert comp_data["priority"] == "HIGH"

    # 2. Student views their submitted complaints
    resp = await async_client.get(
        "/complaints/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 3. Student cannot assign complaint (403)
    resp = await async_client.patch(
        f"/complaints/{comp_id}/assign",
        json={"assigned_to": str(admin_user_id)},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # 4. Admin assigns complaint (200)
    resp = await async_client.patch(
        f"/complaints/{comp_id}/assign",
        json={"assigned_to": str(admin_user_id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["assigned_to"] == str(admin_user_id)
    assert resp.json()["status"] == "IN_PROGRESS"

    # 5. Student adds comment
    resp = await async_client.post(
        f"/complaints/{comp_id}/comments",
        json={"comment": "Temperature reached 32C today."},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 201

    # 6. Trainer updates status to RESOLVED (200)
    resp = await async_client.patch(
        f"/complaints/{comp_id}/status",
        json={
            "status": "RESOLVED",
            "resolution_notes": "Technician replaced the coolant.",
        },
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "RESOLVED"
    assert resp.json()["resolution_notes"] == "Technician replaced the coolant."

    # 7. View complaint detail with comments
    resp = await async_client.get(
        f"/complaints/{comp_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["id"] == comp_id
    assert len(detail["comments"]) >= 1


@pytest.mark.asyncio
async def test_student_complaint_privacy_isolation(
    async_client: AsyncClient,
    admin_token: str,
    student_token: str,
):
    # Admin creates complaint for another student
    resp = await async_client.post(
        "/complaints",
        json={
            "category": "OTHER",
            "title": "Confidential Staff Note",
            "description": "Sensitive investigation note.",
            "priority": "LOW",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    comp_id = resp.json()["id"]

    # Student cannot view other user's complaint (403)
    resp = await async_client.get(
        f"/complaints/{comp_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # Student cannot comment on other user's complaint (403)
    resp = await async_client.post(
        f"/complaints/{comp_id}/comments",
        json={"comment": "Unauthorized comment"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_support_requests_endpoints_and_rbac(
    async_client: AsyncClient,
    admin_token: str,
    trainer_token: str,
    student_token: str,
):
    # 1. Student creates support ticket (201)
    resp = await async_client.post(
        "/support-requests",
        json={
            "category": "LOGIN",
            "title": "Cannot login on mobile browser",
            "description": "OAuth keeps looping on Chrome Android.",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 201
    ticket_id = resp.json()["id"]

    # 2. Student views their support requests
    resp = await async_client.get(
        "/support-requests/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 3. Student cannot query global support queue (403)
    resp = await async_client.get(
        "/support-requests",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # 4. Trainer queries global support queue (200)
    resp = await async_client.get(
        "/support-requests",
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # 5. Trainer resolves ticket (200)
    resp = await async_client.patch(
        f"/support-requests/{ticket_id}",
        json={
            "status": "RESOLVED",
            "resolution": "Advised student to clear third-party cookies.",
        },
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "RESOLVED"


@pytest.mark.asyncio
async def test_auth_guards(async_client: AsyncClient):
    resp = await async_client.get("/complaints/me")
    assert resp.status_code == 401

    resp = await async_client.get(
        "/complaints/me",
        headers={"Authorization": "Bearer bad.token.here"},
    )
    assert resp.status_code == 401
