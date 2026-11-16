# 📋 GymSlot — Attendance Service

The **Attendance Service** is the authoritative attendance tracking, verification, and absence monitoring microservice for the GymSlot platform at SRM University-AP.

It manages scheduled gym sessions, live QR code scanner check-ins, manual AP registration number fallbacks, attendance corrections with full audit logging, student exemptions, and absence threshold monitoring.

It is an async FastAPI microservice owning the `gym_attendance` database, communicating with other services strictly via REST APIs and JWT claims — **no cross-database foreign keys**.

---

## 🏗️ Architecture

```
services/attendance-service/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI factory, lifespan, health check
│   ├── config.py                        # Pydantic Settings supporting .env aliases & extra=ignore
│   ├── database.py                      # Async SQLAlchemy engine + session generator (get_db)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                      # TimestampMixin and uuid_pk helper
│   │   └── attendance.py                # AttendanceSession, AttendanceRecord, AttendanceCorrection,
│   │                                    # GymCardToken, AbsencePolicy, AttendanceExemption
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── attendance.py                # Request/response models, validators, CurrentUser
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── attendance_repository.py     # All async database queries
│   ├── services/
│   │   ├── __init__.py
│   │   └── attendance_service.py        # Domain business logic: check-in windows, late detection,
│   │                                    # duplicate prevention, corrections, consecutive absences
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                      # get_db, get_current_user (JWT decode), require_roles RBAC
│   │   └── attendance.py                # REST endpoints for sessions, scanner, manual check-in, etc.
│   └── exceptions/
│       ├── __init__.py
│       └── attendance_exceptions.py     # Domain exceptions (SessionNotOpen, DuplicateAttendance, etc.)
├── migrations/
│   ├── env.py                           # Async Alembic environment
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py       # Initial schema creation: sessions, attendance, corrections,
│                                        # tokens, policies, exemptions
├── tests/
│   ├── __init__.py
│   ├── conftest.py                      # In-memory SQLite async engine, JWT fixtures
│   ├── test_api_endpoints.py            # HTTP endpoint & RBAC integration tests
│   └── test_attendance_service.py       # Domain & repository unit tests
├── .env.example                         # Environment configuration template
├── Dockerfile                           # Multi-stage build, non-root user, healthcheck
├── alembic.ini                          # Alembic migration configuration
├── requirements.txt                     # Pinned microservice dependencies
└── README.md                            # Complete service reference and API documentation
```

---

## 🗄️ Database Schema (`gym_attendance`)

1. **`attendance_sessions`**: Scheduled gym session snapshot (`slot_id`, `session_date`, `starts_at`, `ends_at`, `status: SCHEDULED | COMPLETED | CANCELLED`).
2. **`attendance`**: Recorded check-in rows (`student_id`, `allocation_id`, `session_id`, `session_date`, `status: PRESENT | ABSENT | LATE | EXCUSED | INVALIDATED`, `check_in_time`, `method: QR_SCAN | MANUAL_FALLBACK`, `staff_id`).
   - `UNIQUE(student_id, session_id)` strictly enforces duplicate check-in prevention.
3. **`attendance_corrections`**: Append-only audit log for administrative modifications or invalidations (`attendance_id`, `corrected_by`, `old_status`, `new_status`, `reason`, `corrected_at`).
4. **`gym_card_tokens`**: Short-lived SHA-256 token hashes for check-in verification (`token_hash`, `student_id`, `allocation_id`, `session_id`, `expires_at`, `revoked_at`).
5. **`absence_policies`**: Configurable absence threshold policy (`consecutive_absence_threshold`, `effective_from`, `effective_until`, `is_active`, `updated_by`).
6. **`attendance_exemptions`**: Authorized exemptions for campus events or medical leave (`session_id`, `student_id`, `reason`, `created_by`).
   - `UNIQUE(student_id, session_id)` prevents redundant exemptions.

---

## 🔒 Security & RBAC Matrix

| Endpoint | Method | Roles Permitted | Description |
|---|---|---|---|
| `/health` | GET | Public | Service liveness and DB connectivity check |
| `/sessions` | POST | `ADMIN`, `SUPER_ADMIN` | Schedule a gym session |
| `/sessions` | GET | Authenticated | List sessions with filters & pagination |
| `/sessions/today` | GET | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | List today's scheduled sessions |
| `/sessions/{id}` | GET | Authenticated | View session details |
| `/sessions/{id}/status` | PATCH | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Mark session COMPLETED or CANCELLED |
| `/sessions/{id}/roster` | GET | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | View session attendance roster |
| `/attendance/scan` | POST | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Verify QR token & record check-in |
| `/attendance/manual` | POST | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Record fallback check-in by AP number |
| `/attendance/me` | GET | `STUDENT` | Current student views own summary/stats |
| `/attendance/student/{id}` | GET | `STUDENT` (self), `TRAINER`, `ADMIN` | View specific student attendance summary |
| `/attendance` | GET | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Query attendance records with filters |
| `/attendance/{id}` | GET | `STUDENT` (self), `TRAINER`, `ADMIN` | View record detail and correction logs |
| `/attendance/{id}/correct` | POST | `ADMIN`, `SUPER_ADMIN` | Administratively correct/invalidate record |
| `/exemptions` | POST | `ADMIN`, `SUPER_ADMIN` | Grant attendance exemption |
| `/exemptions` | GET | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | List active exemptions |
| `/exemptions/{id}` | DELETE | `ADMIN`, `SUPER_ADMIN` | Remove an exemption |
| `/policies/absence` | GET | Authenticated | View current absence policy |
| `/policies/absence` | PUT | `ADMIN`, `SUPER_ADMIN` | Update consecutive absence threshold |
| `/monitoring/absence-candidates`| GET | `ADMIN`, `SUPER_ADMIN` | List warning and termination candidates |
| `/tokens/register` | POST | Authenticated | Register a short-lived QR token hash |

---

## 🧪 Testing

The service includes comprehensive automated test coverage with in-memory SQLite and mock JWT claims:

```bash
# Run all Attendance Service tests
$env:PYTHONPATH="services/attendance-service"
python -m pytest services/attendance-service/tests -v
```

All 17 tests pass cleanly covering session creation, time windows, duplicate check-in prevention, QR token verification, manual AP fallback, audit correction logging, exemption handling, student self-isolation, and absence policy monitoring.
