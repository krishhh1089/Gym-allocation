"""
API endpoint tests for the Slot Service covering RBAC, CRUD, and filters.
"""

import uuid
import pytest
from httpx import AsyncClient


# ── Health check ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    resp = await async_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "slot-service"


# ── Gym Endpoints ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_gym_admin_success(async_client: AsyncClient, admin_token: str):
    payload = {
        "name": "CV Raman Main Gym",
        "location": "Hostel Zone 1",
        "eligibility_group": "ALL",
        "is_active": True,
    }
    resp = await async_client.post(
        "/gyms",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "CV Raman Main Gym"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_gym_forbidden_for_student(
    async_client: AsyncClient, student_token: str
):
    payload = {"name": "Unauthorized Gym", "location": "Nowhere"}
    resp = await async_client.post(
        "/gyms",
        json=payload,
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_gym_unauthenticated(async_client: AsyncClient):
    resp = await async_client.post("/gyms", json={"name": "No Auth", "location": "X"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_and_get_gym(
    async_client: AsyncClient, admin_token: str, student_token: str
):
    # Admin creates gym
    post_resp = await async_client.post(
        "/gyms",
        json={"name": "Ganga South Gym", "location": "Zone 2"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert post_resp.status_code == 201
    gym_id = post_resp.json()["id"]

    # Student can list gyms
    list_resp = await async_client.get(
        "/gyms",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    # Student can get gym by ID
    get_resp = await async_client.get(
        f"/gyms/{gym_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == gym_id


@pytest.mark.asyncio
async def test_update_gym_admin(async_client: AsyncClient, admin_token: str):
    create_resp = await async_client.post(
        "/gyms",
        json={"name": "Old Gym Name", "location": "Old Loc"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    gym_id = create_resp.json()["id"]

    patch_resp = await async_client.patch(
        f"/gyms/{gym_id}",
        json={"name": "Updated Gym Name", "location": "New Loc"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Updated Gym Name"


# ── Slot Endpoints ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_and_list_slots(
    async_client: AsyncClient, admin_token: str, student_token: str
):
    # Setup gym
    gym_resp = await async_client.post(
        "/gyms",
        json={"name": "Krishna East Gym", "location": "Block K"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    gym_id = gym_resp.json()["id"]

    # Admin creates slot
    slot_payload = {
        "gym_id": gym_id,
        "name": "Evening Batch 1",
        "capacity": 30,
        "schedules": [
            {
                "day_of_week": "MONDAY",
                "start_time": "18:00:00",
                "end_time": "19:00:00",
            }
        ],
    }
    slot_resp = await async_client.post(
        "/slots",
        json=slot_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert slot_resp.status_code == 201
    slot_id = slot_resp.json()["id"]
    assert slot_resp.json()["capacity"] == 30

    # Student can list slots filtered by gym_id
    list_resp = await async_client.get(
        f"/slots?gym_id={gym_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == slot_id


@pytest.mark.asyncio
async def test_update_and_delete_slot(async_client: AsyncClient, admin_token: str):
    gym_resp = await async_client.post(
        "/gyms",
        json={"name": "Narmada West Gym", "location": "Block N"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    gym_id = gym_resp.json()["id"]

    slot_resp = await async_client.post(
        "/slots",
        json={"gym_id": gym_id, "capacity": 20},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    slot_id = slot_resp.json()["id"]

    # Update capacity
    patch_resp = await async_client.patch(
        f"/slots/{slot_id}",
        json={"capacity": 40},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["capacity"] == 40

    # Delete slot
    del_resp = await async_client.delete(
        f"/slots/{slot_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_resp.status_code == 204


# ── Schedule Endpoints ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_add_and_delete_schedule(async_client: AsyncClient, admin_token: str):
    gym_resp = await async_client.post(
        "/gyms",
        json={"name": "Schedule Test Gym", "location": "Sports"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    gym_id = gym_resp.json()["id"]

    slot_resp = await async_client.post(
        "/slots",
        json={"gym_id": gym_id, "capacity": 15},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    slot_id = slot_resp.json()["id"]

    # Add schedule
    sched_resp = await async_client.post(
        f"/slots/{slot_id}/schedules",
        json={
            "day_of_week": "WEDNESDAY",
            "start_time": "07:00:00",
            "end_time": "08:00:00",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert sched_resp.status_code == 201
    sched_id = sched_resp.json()["id"]

    # Delete schedule
    del_resp = await async_client.delete(
        f"/schedules/{sched_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_resp.status_code == 204


# ── Trainer Assignment Endpoints ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_trainer_assignments_api(
    async_client: AsyncClient, admin_token: str, trainer_token: str
):
    gym_resp = await async_client.post(
        "/gyms",
        json={"name": "Trainer Assigned Gym", "location": "Field"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    gym_id = gym_resp.json()["id"]
    trainer_id = str(uuid.uuid4())

    # Admin assigns trainer
    assign_resp = await async_client.post(
        "/trainers/assignments",
        json={"trainer_id": trainer_id, "gym_id": gym_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert assign_resp.status_code == 201
    assign_id = assign_resp.json()["id"]

    # Trainer can list assignments
    list_resp = await async_client.get(
        f"/trainers/assignments?gym_id={gym_id}",
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    # Admin can delete assignment
    del_resp = await async_client.delete(
        f"/trainers/assignments/{assign_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_resp.status_code == 204
