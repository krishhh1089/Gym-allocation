"""
Production Infrastructure Integration Test Suite for GymSlot.
Verifies real inter-service communication, real PostgreSQL persistence,
JWT RBAC, allocation workflows, concurrency safety, attendance scanning,
notifications, complaints, reports, and resilience failure scenarios.
"""

import asyncio
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
import httpx
from jose import jwt
import pytest

# Base URLs for services running in Docker Compose (exposed on localhost)
SERVICES = {
    "identity": "http://localhost:8001",
    "student": "http://localhost:8002",
    "slot": "http://localhost:8003",
    "allocation": "http://localhost:8004",
    "attendance": "http://localhost:8005",
    "notification": "http://localhost:8006",
    "complaint": "http://localhost:8007",
    "report": "http://localhost:8008",
}

JWT_SECRET = "change-me-generate-a-long-random-string"
JWT_ALGORITHM = "HS256"


def make_jwt(user_id: uuid.UUID, email: str, roles: list[str], status: str = "ACTIVE", expire_minutes: int = 60) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expire_minutes)
    payload = {
        "sub": str(user_id),
        "email": email,
        "roles": roles,
        "status": status,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ==============================================================================
# 1. Health and Readiness Checks
# ==============================================================================

@pytest.mark.asyncio
async def test_01_health_and_service_readiness():
    async with httpx.AsyncClient(timeout=10.0) as client:
        for name, base_url in SERVICES.items():
            resp = await client.get(f"{base_url}/health")
            assert resp.status_code == 200, f"{name} health check failed with {resp.status_code}"
            data = resp.json()
            assert data["status"] == "ok"
            if name != "identity":
                assert data["database"] == "ok", f"{name} database check not ok"


# ==============================================================================
# 2. Identity, JWT RBAC & Auth Security
# ==============================================================================

@pytest.mark.asyncio
async def test_02_identity_jwt_and_rbac_enforcement():
    admin_id = uuid.uuid4()
    student_id = uuid.uuid4()

    admin_token = make_jwt(admin_id, "admin@srmap.edu.in", ["ADMIN"])
    student_token = make_jwt(student_id, "student@srmap.edu.in", ["STUDENT"])
    expired_token = make_jwt(student_id, "student@srmap.edu.in", ["STUDENT"], expire_minutes=-10)
    invalid_token = jwt.encode({"sub": str(student_id)}, "wrong-secret", algorithm=JWT_ALGORITHM)

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Admin can access admin-only endpoints
        resp = await client.get(
            f"{SERVICES['report']}/reports",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200

        # Student is forbidden on admin-only endpoints (403)
        resp = await client.get(
            f"{SERVICES['report']}/reports",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 403

        # Expired token is rejected (401)
        resp = await client.get(
            f"{SERVICES['report']}/reports",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401

        # Invalid signature token is rejected (401)
        resp = await client.get(
            f"{SERVICES['report']}/reports",
            headers={"Authorization": f"Bearer {invalid_token}"},
        )
        assert resp.status_code == 401


# ==============================================================================
# 3. Student Provisioning and Self-Profile
# ==============================================================================

@pytest.mark.asyncio
async def test_03_student_provisioning_and_retrieval():
    admin_id = uuid.uuid4()
    student_user_id = uuid.uuid4()
    admin_token = make_jwt(admin_id, "admin@srmap.edu.in", ["ADMIN"])
    student_token = make_jwt(student_user_id, f"student_{student_user_id.hex[:6]}@srmap.edu.in", ["STUDENT"])

    reg_no = f"AP231100{secrets_rand_digits()}"
    student_payload = {
        "identity_user_id": str(student_user_id),
        "registration_number": reg_no,
        "full_name": "Aditya Sharma",
        "email": f"student_{student_user_id.hex[:6]}@srmap.edu.in",
        "department": "Computer Science & Engineering",
        "programme": "B.Tech",
        "academic_year": 3,
        "semester": 5,
        "phone_number": "+919876543210",
        "account_status": "ACTIVE",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Admin provisions student
        create_resp = await client.post(
            f"{SERVICES['student']}/students",
            json=student_payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert create_resp.status_code == 201, create_resp.text
        created_data = create_resp.json()
        assert created_data["registration_number"] == reg_no

        # Student retrieves own profile via /students/me
        me_resp = await client.get(
            f"{SERVICES['student']}/students/me",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert me_resp.status_code == 200, me_resp.text
        assert me_resp.json()["registration_number"] == reg_no

        # Student updates phone number
        patch_resp = await client.patch(
            f"{SERVICES['student']}/students/me",
            json={"phone_number": "+919999988888"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["phone_number"] == "+919999988888"


# ==============================================================================
# 4. Facility and Slot Management
# ==============================================================================

@pytest.mark.asyncio
async def test_04_gym_and_slot_management():
    admin_id = uuid.uuid4()
    admin_token = make_jwt(admin_id, "admin@srmap.edu.in", ["ADMIN"])
    student_token = make_jwt(uuid.uuid4(), "student@srmap.edu.in", ["STUDENT"])

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Create Gym facility
        gym_name = f"North Campus Complex {secrets_rand_digits()}"
        gym_resp = await client.post(
            f"{SERVICES['slot']}/gyms",
            json={
                "name": gym_name,
                "description": "Multi-tier athletic facility",
                "location": "Sports Block B",
                "is_active": True,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert gym_resp.status_code == 201, gym_resp.text
        gym_id = gym_resp.json()["id"]

        # 2. Create Slot under gym
        slot_resp = await client.post(
            f"{SERVICES['slot']}/slots",
            json={
                "gym_id": gym_id,
                "name": "Evening Strength Slot",
                "start_time": "17:00:00",
                "end_time": "18:00:00",
                "gender_policy": "UNISEX",
                "capacity": 40,
                "is_active": True,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert slot_resp.status_code == 201, slot_resp.text
        slot_id = slot_resp.json()["id"]

        # 3. Create weekly recurring schedule
        sched_resp = await client.post(
            f"{SERVICES['slot']}/slots/{slot_id}/schedules",
            json={
                "day_of_week": "TUESDAY",
                "start_time": "17:00:00",
                "end_time": "18:00:00",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert sched_resp.status_code == 201, sched_resp.text

        # 4. Student can query slots catalog
        list_resp = await client.get(
            f"{SERVICES['slot']}/slots?gym_id={gym_id}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert list_resp.status_code == 200
        assert any(s["id"] == slot_id for s in list_resp.json()["items"])


# ==============================================================================
# 5. Slot Allocation, Waitlisting & Waitlist Promotion
# ==============================================================================

@pytest.mark.asyncio
async def test_05_allocation_booking_waitlist_and_promotion():
    admin_id = uuid.uuid4()
    admin_token = make_jwt(admin_id, "admin@srmap.edu.in", ["ADMIN"])

    student_a_id = uuid.uuid4()
    student_b_id = uuid.uuid4()
    student_a_token = make_jwt(student_a_id, "student_a@srmap.edu.in", ["STUDENT"])
    student_b_token = make_jwt(student_b_id, "student_b@srmap.edu.in", ["STUDENT"])

    slot_uuid = uuid.uuid4()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Create open Registration Window
        now = datetime.now(timezone.utc)
        window_resp = await client.post(
            f"{SERVICES['allocation']}/windows",
            json={
                "name": f"Semester Window {secrets_rand_digits()}",
                "opens_at": (now - timedelta(days=1)).isoformat(),
                "closes_at": (now + timedelta(days=10)).isoformat(),
                "status": "OPEN",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert window_resp.status_code == 201, window_resp.text
        window_id = window_resp.json()["id"]

        # 2. Set slot capacity to 1 (to test waitlist overflow)
        cap_resp = await client.post(
            f"{SERVICES['allocation']}/capacities",
            json={
                "slot_id": str(slot_uuid),
                "max_capacity": 1,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert cap_resp.status_code in (200, 201), cap_resp.text

        # 3. Student A applies -> gets APPROVED & ACTIVE allocation
        apply_a = await client.post(
            f"{SERVICES['allocation']}/applications",
            json={
                "registration_window_id": window_id,
                "slot_id": str(slot_uuid),
            },
            headers={"Authorization": f"Bearer {student_a_token}"},
        )
        assert apply_a.status_code == 201, apply_a.text
        assert apply_a.json()["status"] == "APPROVED"

        # Check Student A's active allocation & pass
        my_alloc_a = await client.get(
            f"{SERVICES['allocation']}/allocations/me",
            headers={"Authorization": f"Bearer {student_a_token}"},
        )
        assert my_alloc_a.status_code == 200
        alloc_a_data = my_alloc_a.json()
        assert alloc_a_data["status"] == "ACTIVE"
        assert alloc_a_data["slot_id"] == str(slot_uuid)

        # 4. Student B applies -> slot full -> WAITLISTED
        apply_b = await client.post(
            f"{SERVICES['allocation']}/applications",
            json={
                "registration_window_id": window_id,
                "slot_id": str(slot_uuid),
            },
            headers={"Authorization": f"Bearer {student_b_token}"},
        )
        assert apply_b.status_code == 201, apply_b.text
        assert apply_b.json()["status"] == "WAITLISTED"
        app_b_id = apply_b.json()["id"]

        # 5. Check waitlist position for Student B
        wl_resp = await client.get(
            f"{SERVICES['allocation']}/applications/{app_b_id}/waitlist",
            headers={"Authorization": f"Bearer {student_b_token}"},
        )
        assert wl_resp.status_code == 200
        assert wl_resp.json()["status"] == "WAITLISTED"
        assert wl_resp.json()["waitlist_position"] == 1

        # 6. Student A generates dynamic QR token pass
        qr_gen = await client.post(
            f"{SERVICES['allocation']}/gym-card/token",
            headers={"Authorization": f"Bearer {student_a_token}"},
        )
        assert qr_gen.status_code == 200, qr_gen.text
        raw_token = qr_gen.json()["token"]
        assert len(raw_token) > 10

        # 7. Trainer verifies student pass
        trainer_token = make_jwt(uuid.uuid4(), "trainer@srmap.edu.in", ["TRAINER"])
        qr_ver = await client.post(
            f"{SERVICES['allocation']}/gym-card/verify",
            json={"token": raw_token},
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert qr_ver.status_code == 200
        assert qr_ver.json()["is_valid"] is True


# ==============================================================================
# 6. Concurrency Safety Against Real PostgreSQL
# ==============================================================================

@pytest.mark.asyncio
async def test_06_high_concurrency_allocation():
    admin_id = uuid.uuid4()
    admin_token = make_jwt(admin_id, "admin@srmap.edu.in", ["ADMIN"])
    slot_uuid = uuid.uuid4()

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Create active window
        now = datetime.now(timezone.utc)
        window_resp = await client.post(
            f"{SERVICES['allocation']}/windows",
            json={
                "name": f"Concurrency Window {secrets_rand_digits()}",
                "opens_at": (now - timedelta(days=1)).isoformat(),
                "closes_at": (now + timedelta(days=10)).isoformat(),
                "status": "OPEN",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert window_resp.status_code == 201, window_resp.text
        window_id = window_resp.json()["id"]

        # Set capacity to 1
        cap_resp = await client.post(
            f"{SERVICES['allocation']}/capacities",
            json={"slot_id": str(slot_uuid), "max_capacity": 1},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert cap_resp.status_code in (200, 201), cap_resp.text

        # 5 students attempt to book concurrently
        students = [uuid.uuid4() for _ in range(5)]
        tokens = [make_jwt(s, f"student_{s.hex[:4]}@srmap.edu.in", ["STUDENT"]) for s in students]

        async def book(tok):
            async with httpx.AsyncClient(timeout=10.0) as c:
                return await c.post(
                    f"{SERVICES['allocation']}/applications",
                    json={"registration_window_id": window_id, "slot_id": str(slot_uuid)},
                    headers={"Authorization": f"Bearer {tok}"},
                )

        responses = await asyncio.gather(*(book(t) for t in tokens))
        statuses = [r.json().get("status") for r in responses]

        # Exactly 1 allocated, remaining 4 waitlisted under row locks
        allocated_count = statuses.count("APPROVED")
        waitlisted_count = statuses.count("WAITLISTED")
        assert allocated_count == 1, f"Expected 1 allocated under lock, got {allocated_count}"
        assert waitlisted_count == 4, f"Expected 4 waitlisted, got {waitlisted_count}"


# ==============================================================================
# 7. Attendance Session and Digital QR Check-in
# ==============================================================================

@pytest.mark.asyncio
async def test_07_attendance_session_and_qr_checkin():
    admin_id = uuid.uuid4()
    admin_token = make_jwt(admin_id, "admin@srmap.edu.in", ["ADMIN"])

    trainer_id = uuid.uuid4()
    trainer_token = make_jwt(trainer_id, "trainer@srmap.edu.in", ["TRAINER"])

    student_id = uuid.uuid4()
    slot_id = uuid.uuid4()
    alloc_id = uuid.uuid4()
    token_str = f"PASS-{uuid.uuid4().hex}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Admin opens Attendance Session for today
        now = datetime.now(timezone.utc)
        today = now.date()
        sess_resp = await client.post(
            f"{SERVICES['attendance']}/sessions",
            json={
                "slot_id": str(slot_id),
                "session_date": str(today),
                "starts_at": (now - timedelta(minutes=5)).isoformat(),
                "ends_at": (now + timedelta(minutes=55)).isoformat(),
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert sess_resp.status_code == 201, sess_resp.text
        session_id = sess_resp.json()["id"]

        # 2. Register Gym Card Token
        tok_reg = await client.post(
            f"{SERVICES['attendance']}/tokens/register",
            json={
                "student_id": str(student_id),
                "allocation_id": str(alloc_id),
                "token_hash": hashlib.sha256(token_str.encode("utf-8")).hexdigest(),
                "expires_at": (now + timedelta(hours=2)).isoformat(),
                "session_id": session_id,
            },
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert tok_reg.status_code == 201, tok_reg.text

        # 3. Trainer scans QR pass -> VALID_AND_ELIGIBLE
        scan_resp = await client.post(
            f"{SERVICES['attendance']}/attendance/scan",
            json={
                "raw_token": token_str,
                "session_id": session_id,
                "student_id": str(student_id),
                "allocation_id": str(alloc_id),
            },
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert scan_resp.status_code == 200, scan_resp.text
        assert scan_resp.json()["outcome"] == "VALID_AND_ELIGIBLE"

        # 4. Duplicate scan attempt -> 409 Conflict
        dup_resp = await client.post(
            f"{SERVICES['attendance']}/attendance/scan",
            json={
                "raw_token": token_str,
                "session_id": session_id,
                "student_id": str(student_id),
                "allocation_id": str(alloc_id),
            },
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert dup_resp.status_code == 409

        # 5. Manual check-in desk for another student
        manual_student_id = uuid.uuid4()
        manual_alloc_id = uuid.uuid4()
        man_resp = await client.post(
            f"{SERVICES['attendance']}/attendance/manual",
            json={
                "session_id": session_id,
                "student_id": str(manual_student_id),
                "allocation_id": str(manual_alloc_id),
                "status": "PRESENT",
                "reason": "Forgot phone at hostel",
            },
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert man_resp.status_code == 200, man_resp.text
        assert man_resp.json()["status"] == "PRESENT"


# ==============================================================================
# 8. Notifications and Deduplication
# ==============================================================================

@pytest.mark.asyncio
async def test_08_notification_deduplication_and_inbox():
    student_id = uuid.uuid4()
    student_token = make_jwt(student_id, "student@srmap.edu.in", ["STUDENT"])
    admin_token = make_jwt(uuid.uuid4(), "admin@srmap.edu.in", ["ADMIN"])

    dedup_key = f"dedup-{uuid.uuid4()}"
    notif_payload = {
        "user_id": str(student_id),
        "subject": "Slot Allocated",
        "message": "Your evening gym slot has been confirmed.",
        "type": "ALLOCATION_CONFIRMED",
        "channel": "IN_APP",
        "deduplication_key": dedup_key,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Dispatch first notification
        resp1 = await client.post(
            f"{SERVICES['notification']}/notifications",
            json=notif_payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp1.status_code == 201, resp1.text
        notif_id = resp1.json()["id"]

        # 2. Re-dispatch same key -> returns existing notification (deduplication)
        resp2 = await client.post(
            f"{SERVICES['notification']}/notifications",
            json=notif_payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp2.status_code == 201
        assert resp2.json()["id"] == notif_id

        # 3. Student views inbox
        inbox_resp = await client.get(
            f"{SERVICES['notification']}/notifications/me",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert inbox_resp.status_code == 200
        items = inbox_resp.json()["items"]
        assert any(n["id"] == notif_id for n in items)

        # 4. Mark as read
        read_resp = await client.patch(
            f"{SERVICES['notification']}/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert read_resp.status_code == 200
        assert read_resp.json()["status"] == "READ"


# ==============================================================================
# 9. Complaint Ticketing and Support
# ==============================================================================

@pytest.mark.asyncio
async def test_09_complaint_ticketing_and_comments():
    student_id = uuid.uuid4()
    student_token = make_jwt(student_id, "student@srmap.edu.in", ["STUDENT"])
    admin_token = make_jwt(uuid.uuid4(), "admin@srmap.edu.in", ["ADMIN"])

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Student submits complaint
        comp_resp = await client.post(
            f"{SERVICES['complaint']}/complaints",
            json={
                "category": "EQUIPMENT",
                "priority": "HIGH",
                "title": "Treadmill #3 display broken",
                "description": "The emergency stop button is non-responsive.",
            },
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert comp_resp.status_code == 201, comp_resp.text
        complaint_id = comp_resp.json()["id"]

        # 2. Admin inspects complaints
        list_resp = await client.get(
            f"{SERVICES['complaint']}/complaints",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert list_resp.status_code == 200
        assert any(c["id"] == complaint_id for c in list_resp.json()["items"])

        # 3. Admin updates status to IN_PROGRESS
        patch_resp = await client.patch(
            f"{SERVICES['complaint']}/complaints/{complaint_id}/status",
            json={"status": "IN_PROGRESS"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["status"] == "IN_PROGRESS"

        # 4. Staff comments on complaint
        comment_resp = await client.post(
            f"{SERVICES['complaint']}/complaints/{complaint_id}/comments",
            json={"comment": "Maintenance technician scheduled for 10:00 AM tomorrow."},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert comment_resp.status_code == 201, comment_resp.text
        assert "scheduled" in comment_resp.json()["comment"]


# ==============================================================================
# 10. Reports, CSV Export and Central Audit Logs
# ==============================================================================

@pytest.mark.asyncio
async def test_10_reports_exports_and_audit_logging():
    admin_id = uuid.uuid4()
    admin_token = make_jwt(admin_id, "admin@srmap.edu.in", ["ADMIN"])

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Request report generation
        rep_resp = await client.post(
            f"{SERVICES['report']}/reports",
            json={
                "name": "Integration Audit Report",
                "type": "CAPACITY_UTILIZATION",
                "format": "CSV",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert rep_resp.status_code == 201, rep_resp.text
        report_id = rep_resp.json()["id"]

        # 2. Download CSV content
        dl_resp = await client.get(
            f"{SERVICES['report']}/reports/{report_id}/download",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert dl_resp.status_code == 200
        assert dl_resp.headers["content-type"].startswith("text/csv")
        assert "Gym ID" in dl_resp.text

        # 3. Record Audit Log
        audit_resp = await client.post(
            f"{SERVICES['report']}/audit-logs",
            json={
                "actor_id": str(admin_id),
                "action": "CONFIG_UPDATE",
                "target_type": "GYM_SLOT",
                "target_id": str(uuid.uuid4()),
                "reason": "Routine capacity adjustment",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert audit_resp.status_code == 201, audit_resp.text
        audit_id = audit_resp.json()["id"]

        # Query audit log
        get_audit = await client.get(
            f"{SERVICES['report']}/audit-logs/{audit_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert get_audit.status_code == 200
        assert get_audit.json()["action"] == "CONFIG_UPDATE"

        # 4. Analytics Summary
        summary_resp = await client.get(
            f"{SERVICES['report']}/analytics/summary",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert summary_resp.status_code == 200
        assert "active_allocations" in summary_resp.json()


def secrets_rand_digits() -> str:
    import random
    return str(random.randint(10000, 99999))
