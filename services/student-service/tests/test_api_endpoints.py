"""
API endpoint tests for the Student Service.
Covers all 15 required test scenarios.
"""

import uuid

import pytest
from httpx import AsyncClient

from tests.conftest import make_student_payload


# ── 1. POST /students — success (admin) ───────────────────────────────────────

@pytest.mark.asyncio
async def test_create_student_as_admin(async_client: AsyncClient, admin_token: str):
    payload = make_student_payload()
    resp = await async_client.post(
        "/students",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["registration_number"] == payload["registration_number"]
    assert data["email"] == payload["email"].lower()
    assert data["account_status"] == "PENDING"
    assert "id" in data


# ── 2. POST /students — 409 duplicate registration number ─────────────────────

@pytest.mark.asyncio
async def test_create_student_duplicate_reg_number(
    async_client: AsyncClient, admin_token: str
):
    payload = make_student_payload(reg_number="AP21DUP001", email="dup1@srmap.edu.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp1 = await async_client.post("/students", json=payload, headers=headers)
    assert resp1.status_code == 201

    # Same reg number, different email
    payload2 = make_student_payload(reg_number="AP21DUP001", email="dup2@srmap.edu.in")
    resp2 = await async_client.post("/students", json=payload2, headers=headers)
    assert resp2.status_code == 409
    assert "already in use" in resp2.json()["detail"].lower() or "registration" in resp2.json()["detail"].lower()


# ── 3. POST /students — 401 no auth ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_student_no_auth(async_client: AsyncClient):
    payload = make_student_payload(reg_number="AP21NOAUTH", email="noauth@srmap.edu.in")
    resp = await async_client.post("/students", json=payload)
    assert resp.status_code == 401


# ── 4. POST /students — 403 student role ─────────────────────────────────────

@pytest.mark.asyncio
async def test_create_student_forbidden_for_student_role(
    async_client: AsyncClient, student_token: str
):
    payload = make_student_payload(reg_number="AP21FORBID", email="forbid@srmap.edu.in")
    resp = await async_client.post(
        "/students",
        json=payload,
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403


# ── 5. GET /students — paginated list (admin) ─────────────────────────────────

@pytest.mark.asyncio
async def test_list_students_as_admin(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Create a couple of students first
    for i in range(3):
        await async_client.post(
            "/students",
            json=make_student_payload(
                reg_number=f"AP21LIST{i:03d}",
                email=f"listtest{i}@srmap.edu.in",
            ),
            headers=headers,
        )
    resp = await async_client.get("/students?skip=0&limit=20", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 3


# ── 6. GET /students?department=CSE — filtered list ───────────────────────────

@pytest.mark.asyncio
async def test_list_students_filtered_by_department(
    async_client: AsyncClient, admin_token: str
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    await async_client.post(
        "/students",
        json=make_student_payload(
            reg_number="AP21DEPT001",
            email="dept001@srmap.edu.in",
            department="ECE",
        ),
        headers=headers,
    )
    resp = await async_client.get("/students?department=ECE", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    for item in data["items"]:
        assert item["department"].upper() == "ECE"


# ── 7. GET /students?search=John — search ─────────────────────────────────────

@pytest.mark.asyncio
async def test_list_students_search(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    await async_client.post(
        "/students",
        json=make_student_payload(
            reg_number="AP21SRCH001",
            email="johnsearch@srmap.edu.in",
            full_name="John Search",
        ),
        headers=headers,
    )
    resp = await async_client.get("/students?search=John+Search", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert any("John" in item["full_name"] for item in data["items"])


# ── 8. GET /students/{id} — found ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_student_found(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/students",
        json=make_student_payload(reg_number="AP21FOUND001", email="found001@srmap.edu.in"),
        headers=headers,
    )
    assert create_resp.status_code == 201
    student_id = create_resp.json()["id"]

    resp = await async_client.get(f"/students/{student_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == student_id


# ── 9. GET /students/{id} — 404 not found ────────────────────────────────────

@pytest.mark.asyncio
async def test_get_student_not_found(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    fake_id = str(uuid.uuid4())
    resp = await async_client.get(f"/students/{fake_id}", headers=headers)
    assert resp.status_code == 404


# ── 10. GET /students/me — student sees own profile ───────────────────────────

@pytest.mark.asyncio
async def test_get_my_profile_as_student(
    async_client: AsyncClient,
    admin_token: str,
    student_token: str,
    student_user_id: uuid.UUID,
):
    # Admin creates the student, linked to student_user_id
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/students",
        json=make_student_payload(
            reg_number="AP21ME001",
            email="metest001@srmap.edu.in",
            identity_user_id=str(student_user_id),
        ),
        headers=headers_admin,
    )
    assert create_resp.status_code == 201

    headers_student = {"Authorization": f"Bearer {student_token}"}
    resp = await async_client.get("/students/me", headers=headers_student)
    assert resp.status_code == 200
    data = resp.json()
    assert data["registration_number"] == "AP21ME001"


# ── 11. PATCH /students/me — student updates allowed fields ───────────────────

@pytest.mark.asyncio
async def test_student_updates_own_profile(
    async_client: AsyncClient,
    admin_token: str,
    student_token: str,
    student_user_id: uuid.UUID,
):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    await async_client.post(
        "/students",
        json=make_student_payload(
            reg_number="AP21UPME01",
            email="upme01@srmap.edu.in",
            identity_user_id=str(student_user_id),
        ),
        headers=headers_admin,
    )

    headers_student = {"Authorization": f"Bearer {student_token}"}
    resp = await async_client.patch(
        "/students/me",
        json={"phone_number": "1111111111"},
        headers=headers_student,
    )
    assert resp.status_code == 200
    assert resp.json()["phone_number"] == "1111111111"


# ── 12. PATCH /students/{id} — admin update ───────────────────────────────────

@pytest.mark.asyncio
async def test_admin_updates_student(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/students",
        json=make_student_payload(reg_number="AP21ADMIN01", email="admin01@srmap.edu.in"),
        headers=headers,
    )
    student_id = create_resp.json()["id"]

    resp = await async_client.patch(
        f"/students/{student_id}",
        json={"full_name": "Updated Name", "semester": 4},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Updated Name"
    assert data["semester"] == 4


# ── 13. PATCH /students/{id}/status — admin status update ────────────────────

@pytest.mark.asyncio
async def test_admin_updates_student_status(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/students",
        json=make_student_payload(reg_number="AP21STATUS1", email="status1@srmap.edu.in"),
        headers=headers,
    )
    student_id = create_resp.json()["id"]

    resp = await async_client.patch(
        f"/students/{student_id}/status",
        json={"account_status": "ACTIVE"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["account_status"] == "ACTIVE"


# ── 14. GET /students/{id} — trainer read access ──────────────────────────────

@pytest.mark.asyncio
async def test_trainer_can_read_student(
    async_client: AsyncClient, admin_token: str, trainer_token: str
):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/students",
        json=make_student_payload(reg_number="AP21TRAIN01", email="train01@srmap.edu.in"),
        headers=headers_admin,
    )
    student_id = create_resp.json()["id"]

    headers_trainer = {"Authorization": f"Bearer {trainer_token}"}
    resp = await async_client.get(f"/students/{student_id}", headers=headers_trainer)
    assert resp.status_code == 200
    assert resp.json()["id"] == student_id


# ── 15. PATCH /students/{id} — 403 trainer cannot modify ─────────────────────

@pytest.mark.asyncio
async def test_trainer_cannot_modify_student(
    async_client: AsyncClient, admin_token: str, trainer_token: str
):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    create_resp = await async_client.post(
        "/students",
        json=make_student_payload(reg_number="AP21TRMOD01", email="trmod01@srmap.edu.in"),
        headers=headers_admin,
    )
    student_id = create_resp.json()["id"]

    headers_trainer = {"Authorization": f"Bearer {trainer_token}"}
    resp = await async_client.patch(
        f"/students/{student_id}",
        json={"full_name": "Should Fail"},
        headers=headers_trainer,
    )
    assert resp.status_code == 403
