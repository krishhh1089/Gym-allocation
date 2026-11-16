# 🎫 GymSlot — Complaint Service

The **Complaint Service** is the official issue management and operational support ticketing microservice for the GymSlot platform at SRM University-AP.

It manages formal student and staff complaints across categories (equipment, facility, cleanliness, staff, timing), staff assignment workflows, threaded discussion comments, and fast in-app operational support triage requests.

It is an async FastAPI microservice owning the `gym_complaint` database, communicating with other services strictly via REST APIs and JWT claims — **no cross-database foreign keys**.

---

## 🏗️ Architecture

```
services/complaint-service/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI factory, lifespan, health check
│   ├── config.py                        # Pydantic Settings supporting .env aliases & extra=ignore
│   ├── database.py                      # Async SQLAlchemy engine + session generator (get_db)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                      # TimestampMixin and uuid_pk helper
│   │   └── complaint.py                 # Complaint, ComplaintComment, SupportRequest
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── complaint.py                 # Request/response models, validators, CurrentUser
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── complaint_repository.py      # All async database queries
│   ├── services/
│   │   ├── __init__.py
│   │   └── complaint_service.py         # Domain business logic: status lifecycle transitions,
│   │                                    # assignment, resolution notes, operational triage
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                      # get_db, get_current_user (JWT decode), require_roles RBAC
│   │   └── complaints.py                # REST endpoints for complaints, comments, support tickets
│   └── exceptions/
│       ├── __init__.py
│       └── complaint_exceptions.py      # Domain exceptions (ComplaintNotFound, InvalidStatusTransition)
├── migrations/
│   ├── env.py                           # Async Alembic environment
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py       # Initial schema creation: complaints, complaint_comments,
│                                        # support_requests
├── tests/
│   ├── __init__.py
│   ├── conftest.py                      # In-memory SQLite async engine, JWT fixtures
│   ├── test_api_endpoints.py            # HTTP endpoint & RBAC integration tests
│   └── test_complaint_service.py        # Domain & repository unit tests
├── .env.example                         # Environment configuration template
├── Dockerfile                           # Multi-stage build, non-root user, healthcheck
├── alembic.ini                          # Alembic migration configuration
├── requirements.txt                     # Pinned microservice dependencies
└── README.md                            # Complete service reference and API documentation
```

---

## 🗄️ Database Schema (`gym_complaint`)

1. **`complaints`**: Formal complaint record (`student_id`, `submitted_by`, `category: EQUIPMENT | FACILITY | TRAINER | CLEANLINESS | SLOT_TIMING | OTHER`, `title`, `description`, `status: OPEN | IN_PROGRESS | RESOLVED | CLOSED | REJECTED`, `priority: LOW | MEDIUM | HIGH | URGENT`, `assigned_to`, `resolution_notes`, `resolved_at`).
2. **`complaint_comments`**: Threaded communication log between students and administrative staff (`complaint_id`, `user_id`, `comment`, `created_at`).
3. **`support_requests`**: Quick in-app operational support tickets (`student_id`, `category: ALLOCATION | ATTENDANCE | LOGIN | OTHER`, `title`, `description`, `status: OPEN | IN_PROGRESS | RESOLVED | CLOSED`, `assigned_to`, `resolution`, `resolved_at`).

---

## 🔒 Security & RBAC Matrix

| Endpoint | Method | Roles Permitted | Description |
|---|---|---|---|
| `/health` | GET | Public | Service liveness and DB connectivity check |
| `/complaints` | POST | Authenticated | Submit a formal gym complaint |
| `/complaints/me` | GET | Authenticated | List personal submitted complaints |
| `/complaints` | GET | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | List and filter all system complaints |
| `/complaints/{id}` | GET | Owner / Staff | View complaint details and comments |
| `/complaints/{id}/status` | PATCH | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Update status & resolution notes |
| `/complaints/{id}/assign` | PATCH | `ADMIN`, `SUPER_ADMIN` | Assign complaint to staff member |
| `/complaints/{id}/comments` | POST | Owner / Staff | Add a comment to the complaint thread |
| `/support-requests` | POST | Authenticated | Submit an operational help ticket |
| `/support-requests/me` | GET | Authenticated | List personal submitted support tickets |
| `/support-requests` | GET | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | View and filter all support tickets |
| `/support-requests/{id}` | GET | Owner / Staff | View ticket details |
| `/support-requests/{id}` | PATCH | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Resolve or assign support ticket |

---

## 🧪 Testing

The service includes comprehensive automated test coverage with in-memory SQLite and mock JWT claims:

```bash
# Run all Complaint Service tests
$env:PYTHONPATH="services/complaint-service"
python -m pytest services/complaint-service/tests -v
```

All 8 tests pass cleanly covering complaint lifecycle, staff assignment, comments, status transitions, support tickets, user privacy isolation, and role authorization guards.
