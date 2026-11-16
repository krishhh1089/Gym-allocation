"""
API endpoint tests for the Allocation Service covering RBAC, applications, tokens, and transfers.
"""

import uuid
from datetime import timedelta
import pytest
from httpx import AsyncClient

from app.models.base import utcnow


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "allocation-service"


@pytest.mark.asyncio
async def test_create_registration_window_admin_only(
    async_client: AsyncClient, admin_token: str, student_token: str
):
    now = utcnow()
    payload = {
        "name": "Fall 2026 Admin Window",
        "opens_at": (now - timedelta(hours=1)).isoformat(),
        "closes_at": (now + timedelta(days=5)).isoformat(),
        "status": "OPEN",
    }

    # Student cannot create window
    forbidden_resp = await async_client.post(
        "/windows",
        json=payload,
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert forbidden_resp.status_code == 403

    # Admin can create window
    admin_resp = await async_client.post(
        "/windows",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_resp.status_code == 201
    assert admin_resp.json()["name"] == "Fall 2026 Admin Window"


@pytest.mark.asyncio
async def test_set_and_get_capacity(async_client: AsyncClient, admin_token: str):
    slot_id = str(uuid.uuid4())
    cap_resp = await async_client.post(
        "/capacities",
        json={"slot_id": slot_id, "max_capacity": 50},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert cap_resp.status_code == 200
    assert cap_resp.json()["max_capacity"] == 50

    get_resp = await async_client.get(
        f"/capacities/{slot_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["max_capacity"] == 50


@pytest.mark.asyncio
async def test_student_apply_and_get_allocation(
    async_client: AsyncClient, admin_token: str, student_token: str
):
    now = utcnow()
    # 1. Admin opens window
    win_resp = await async_client.post(
        "/windows",
        json={
            "name": "Active Registration",
            "opens_at": (now - timedelta(hours=1)).isoformat(),
            "closes_at": (now + timedelta(days=5)).isoformat(),
            "status": "OPEN",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    window_id = win_resp.json()["id"]

    slot_id = str(uuid.uuid4())
    # 2. Admin sets capacity
    await async_client.post(
        "/capacities",
        json={"slot_id": slot_id, "max_capacity": 10},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # 3. Student applies
    app_resp = await async_client.post(
        "/applications",
        json={"slot_id": slot_id, "registration_window_id": window_id},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert app_resp.status_code == 201
    assert app_resp.json()["status"] == "APPROVED"

    # 4. Student views their active allocation
    alloc_resp = await async_client.get(
        "/allocations/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert alloc_resp.status_code == 200
    assert alloc_resp.json()["slot_id"] == slot_id
    assert alloc_resp.json()["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_student_qr_pass_and_trainer_verify(
    async_client: AsyncClient, admin_token: str, student_token: str, trainer_token: str
):
    now = utcnow()
    win_resp = await async_client.post(
        "/windows",
        json={
            "name": "QR Flow Window",
            "opens_at": (now - timedelta(hours=1)).isoformat(),
            "closes_at": (now + timedelta(days=5)).isoformat(),
            "status": "OPEN",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    window_id = win_resp.json()["id"]
    slot_id = str(uuid.uuid4())

    await async_client.post(
        "/capacities",
        json={"slot_id": slot_id, "max_capacity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    await async_client.post(
        "/applications",
        json={"slot_id": slot_id, "registration_window_id": window_id},
        headers={"Authorization": f"Bearer {student_token}"},
    )

    # Student generates QR pass
    qr_resp = await async_client.post(
        "/gym-card/token",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert qr_resp.status_code == 200
    token = qr_resp.json()["token"]
    assert token is not None

    # Trainer verifies QR token
    verify_resp = await async_client.post(
        "/gym-card/verify",
        json={"token": token},
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_valid"] is True
    assert verify_resp.json()["slot_id"] == slot_id


@pytest.mark.asyncio
async def test_slot_transfer_api_flow(
    async_client: AsyncClient, admin_token: str, student_token: str
):
    now = utcnow()
    win_resp = await async_client.post(
        "/windows",
        json={
            "name": "Transfer Flow Window",
            "opens_at": (now - timedelta(hours=1)).isoformat(),
            "closes_at": (now + timedelta(days=5)).isoformat(),
            "status": "OPEN",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    window_id = win_resp.json()["id"]
    slot1 = str(uuid.uuid4())
    slot2 = str(uuid.uuid4())

    await async_client.post(
        "/capacities",
        json={"slot_id": slot1, "max_capacity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    await async_client.post(
        "/capacities",
        json={"slot_id": slot2, "max_capacity": 5},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Student gets slot 1
    await async_client.post(
        "/applications",
        json={"slot_id": slot1, "registration_window_id": window_id},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    alloc_resp = await async_client.get(
        "/allocations/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    alloc_id = alloc_resp.json()["id"]

    # Student requests transfer to slot 2
    xfer_resp = await async_client.post(
        "/transfers",
        json={
            "current_allocation_id": alloc_id,
            "requested_slot_id": slot2,
            "reason": "College lab conflict",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert xfer_resp.status_code == 201
    xfer_id = xfer_resp.json()["id"]
    assert xfer_resp.json()["status"] == "PENDING"

    # Admin approves transfer
    review_resp = await async_client.post(
        f"/transfers/{xfer_id}/review",
        json={"action": "APPROVE"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "APPROVED"

    # Verify student's allocation is now slot 2
    my_alloc = await async_client.get(
        "/allocations/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert my_alloc.json()["slot_id"] == slot2
