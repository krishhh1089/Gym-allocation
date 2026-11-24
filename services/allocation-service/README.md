# 🎟️ GymSlot — Allocation Service

The **Allocation Service** is the central orchestration engine for gym slot registration, capacity enforcement, FCFS waitlisting, student allocations, dynamic gym card QR pass generation, and safe slot transfer requests for the GymSlot platform at SRM University-AP.

It is an async FastAPI microservice owning the `gym_allocation` database, communicating with other services strictly via REST APIs and JWT claims — **no cross-database foreign keys**.

---

## 🏗️ Architecture

```
services/allocation-service/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI factory, lifespan, health check
│   ├── config.py                        # Pydantic Settings supporting .env aliases & extra=ignore
│   ├── database.py                      # Async SQLAlchemy engine + session generator (get_db)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                      # TimestampMixin and uuid_pk helper
│   │   └── allocation.py                # RegistrationWindow, SlotCapacity, Application,
│   │                                    # Allocation, GymCardToken, SlotChangeRequest
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── allocation.py                # Request/response models, validators, CurrentUser
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── allocation_repository.py     # All async database queries
│   ├── services/
│   │   ├── __init__.py
│   │   └── allocation_service.py        # Domain business logic: atomic capacity, FCFS priority,
│   │                                    # QR hashing, safe transfer & automatic promotion
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                      # get_db, get_current_user (JWT decode), require_roles RBAC
│   │   └── allocations.py               # REST endpoints for windows, applications, passes, transfers
│   └── exceptions/
│       ├── __init__.py
│       └── allocation_exceptions.py     # Domain exceptions (WindowClosed, SlotFull, DuplicateApp)
├── migrations/
│   ├── README
│   ├── env.py                           # Async Alembic environment
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py       # Initial schema creation: windows, capacity, applications,
│                                        # allocations, tokens, slot change requests
├── tests/
│   ├── __init__.py
│   ├── conftest.py                      # In-memory SQLite async engine, JWT fixtures
│   ├── test_api_endpoints.py            # HTTP endpoint & RBAC integration tests
│   └── test_allocation_service.py       # Domain & repository unit tests
├── .env.example                         # Environment configuration template
├── Dockerfile                           # Multi-stage build, non-root user, healthcheck
├── alembic.ini                          # Alembic migration configuration
├── requirements.txt                     # Pinned microservice dependencies
└── README.md                            # Complete service reference and API documentation
```

---

## 🗄️ Database Schema (`gym_allocation`)

1. **`registration_windows`**: Time-bound application periods (`opens_at`, `closes_at`, optional daily operating hours, `status`).
2. **`slot_capacities`**: Local capacity and queue state (`max_capacity`, `allocated_count`, `waitlisted_count`).
3. **`applications`**: Student slot applications with server-assigned `applied_at_utc` priority and `priority_sequence` tie-breaker.
4. **`allocations`**: Active student slot commitments (`start_date`, `end_date`, `status: ACTIVE | TRANSFERRED | TERMINATED | EXPIRED`).
5. **`gym_card_tokens`**: Opaque short-lived QR token hashes (`token_hash` SHA-256, `expires_at`, `revoked_at`). Plaintext token is never stored in DB.
6. **`slot_change_requests`**: Safe student slot transfer requests (`current_allocation_id`, `requested_slot_id`, `status: PENDING | APPROVED | REJECTED`).

---

## 📡 REST API Reference

| Method | Path | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service liveness & DB connection check |
| `POST` | `/windows` | `ADMIN`, `SUPER_ADMIN` | Create a registration window |
| `GET` | `/windows` | Any Authenticated | List registration windows |
| `GET` | `/windows/{id}` | Any Authenticated | Get window details & status |
| `PATCH` | `/windows/{id}` | `ADMIN`, `SUPER_ADMIN` | Update window schedule or status |
| `POST` | `/capacities` | `ADMIN`, `SUPER_ADMIN` | Configure max capacity for a gym slot |
| `GET` | `/capacities/{slot_id}` | Any Authenticated | View current slot capacity and queue count |
| `POST` | `/applications` | `STUDENT` | Apply for a slot (FCFS queue / immediate allocation) |
| `GET` | `/applications/me` | `STUDENT` | List own submitted applications |
| `GET` | `/applications/{id}/waitlist` | `STUDENT` | Check current waitlist queue position |
| `GET` | `/applications` | `ADMIN`, `TRAINER` | List all applications across slots |
| `GET` | `/allocations/me` | `STUDENT` | Get student's active allocation details |
| `GET` | `/allocations` | `ADMIN`, `TRAINER` | List student allocations with filters |
| `POST` | `/gym-card/token` | `STUDENT` | Generate a dynamic short-lived QR token |
| `POST` | `/gym-card/verify` | `TRAINER`, `ADMIN` | Verify QR token validity and active allocation |
| `POST` | `/transfers` | `STUDENT` | Request transfer to a different slot (safe transfer) |
| `GET` | `/transfers/me` | `STUDENT` | List own transfer requests |
| `GET` | `/transfers` | `ADMIN`, `SUPER_ADMIN` | List pending/past transfer requests |
| `POST` | `/transfers/{id}/review` | `ADMIN`, `SUPER_ADMIN` | Review transfer request (`APPROVE` or `REJECT`) |

*(All endpoints are routed directly and with `/api/v1` prefix for gateway compatibility)*

---

## 🧪 Testing

Run all automated unit and integration tests:

```bash
cd services/allocation-service
pytest tests/ -v
```
