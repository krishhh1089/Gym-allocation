"""
API endpoint and integration tests for Notification Service.
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
    assert data["service"] == "notification-service"


@pytest.mark.asyncio
async def test_notifications_lifecycle_and_rbac(
    async_client: AsyncClient,
    admin_token: str,
    student_token: str,
    student_user_id: uuid.UUID,
):
    # 1. Student cannot send arbitrary notifications (403)
    resp = await async_client.post(
        "/notifications",
        json={
            "user_id": str(student_user_id),
            "subject": "Forbidden",
            "message": "Should fail",
            "type": "GENERAL",
            "channel": "IN_APP",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # 2. Admin sends notification to student (201)
    resp = await async_client.post(
        "/notifications",
        json={
            "user_id": str(student_user_id),
            "subject": "Slot Allocated",
            "message": "Welcome to GymSlot!",
            "type": "ALLOCATION_CONFIRMED",
            "channel": "IN_APP",
            "deduplication_key": f"alloc-{student_user_id}-1",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    notif_data = resp.json()
    notif_id = notif_data["id"]
    assert notif_data["subject"] == "Slot Allocated"

    # 3. Student views their notifications
    resp = await async_client.get(
        "/notifications/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    my_notifs = resp.json()
    assert my_notifs["total"] >= 1
    assert my_notifs["unread_count"] >= 1

    # 4. Student marks notification as read
    resp = await async_client.patch(
        f"/notifications/{notif_id}/read",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "READ"
    assert resp.json()["read_at"] is not None

    # 5. Mark all as read
    resp = await async_client.post(
        "/notifications/read-all",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200

    # 6. Admin query all notifications
    resp = await async_client.get(
        "/notifications",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_student_notification_privacy_and_isolation(
    async_client: AsyncClient,
    admin_token: str,
    student_token: str,
):
    other_user_id = str(uuid.uuid4())

    # Create notification for another user
    resp = await async_client.post(
        "/notifications",
        json={
            "user_id": other_user_id,
            "subject": "Private Note",
            "message": "Top Secret",
            "type": "GENERAL",
            "channel": "IN_APP",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    notif_id = resp.json()["id"]

    # Student cannot view another user's notification by ID (403)
    resp = await async_client.get(
        f"/notifications/{notif_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # Admin can view it (200)
    resp = await async_client.get(
        f"/notifications/{notif_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_announcements_endpoints(
    async_client: AsyncClient,
    admin_token: str,
    student_token: str,
):
    # Student cannot create announcement (403)
    resp = await async_client.post(
        "/announcements",
        json={
            "title": "Hack",
            "content": "Should fail",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # Admin creates announcement (201)
    resp = await async_client.post(
        "/announcements",
        json={
            "title": "Campus Gym Rules Update",
            "content": "Clean gym footwear is strictly mandatory in all weight rooms.",
            "target_role": "ALL",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    ann_id = resp.json()["id"]

    # Student can list announcements (200)
    resp = await async_client.get(
        "/announcements",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # Student can view announcement detail
    resp = await async_client.get(
        f"/announcements/{ann_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == ann_id

    # Admin deletes announcement (204)
    resp = await async_client.delete(
        f"/announcements/{ann_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_templates_endpoints(
    async_client: AsyncClient,
    admin_token: str,
    student_token: str,
):
    # Student cannot manage templates (403)
    resp = await async_client.post(
        "/templates",
        json={
            "code": "TEST_TPL",
            "channel": "EMAIL",
            "subject_template": "Sub",
            "body_template": "Body",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403

    # Admin creates template (201)
    resp = await async_client.post(
        "/templates",
        json={
            "code": "SLOT_CHANGE_DECIDED",
            "channel": "EMAIL",
            "subject_template": "Slot Transfer Decision: {{status}}",
            "body_template": "Your request to transfer to {{new_slot}} was {{status}}.",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201

    # Admin gets template
    resp = await async_client.get(
        "/templates/SLOT_CHANGE_DECIDED",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["code"] == "SLOT_CHANGE_DECIDED"

    # Admin updates template
    resp = await async_client.put(
        "/templates/SLOT_CHANGE_DECIDED",
        json={"subject_template": "Updated Subject {{status}}"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["subject_template"] == "Updated Subject {{status}}"


@pytest.mark.asyncio
async def test_auth_guards(async_client: AsyncClient):
    # Missing auth -> 401
    resp = await async_client.get("/notifications/me")
    assert resp.status_code == 401

    # Invalid token -> 401
    resp = await async_client.get(
        "/notifications/me",
        headers={"Authorization": "Bearer bad.token.here"},
    )
    assert resp.status_code == 401
