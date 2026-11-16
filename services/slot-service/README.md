# 🏋️‍♂️ GymSlot — Slot Service

The **Slot Service** manages campus gym facilities (C. V. Raman, Ganga, Krishna, Narmada), operational slot timings, capacity ceilings, schedule rules, and trainer-gym assignments for the GymSlot platform at SRM University-AP.

It is a FastAPI microservice owning its dedicated PostgreSQL database (`gym_slot`), communicating with other services strictly via REST APIs and JWT claims — **no cross-database foreign keys**.

---

## 🏗️ Architecture

```
services/slot-service/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI factory, lifespan, CORS, health endpoint
│   ├── config.py                        # Pydantic Settings supporting .env aliases & extra=ignore
│   ├── database.py                      # Async SQLAlchemy engine + session generator (get_db)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                      # TimestampMixin and uuid_pk helper
│   │   └── gym.py                       # Gym, GymSlot, SlotSchedule, TrainerGymAssignment
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── gym.py                       # Request/response schemas, validators, CurrentUser
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── slot_repository.py           # All DB async queries, pagination & filter logic
│   ├── services/
│   │   ├── __init__.py
│   │   └── slot_service.py              # Domain service: capacity checks, schedule validations
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                      # get_db, get_current_user (JWT decode), require_roles RBAC
│   │   └── gyms.py                      # REST API endpoints for Gyms, Slots, Schedules, Assignments
│   └── exceptions/
│       ├── __init__.py
│       └── slot_exceptions.py          # Domain exceptions (GymNotFound, SlotNotFound, DuplicateName)
├── migrations/
│   ├── README
│   ├── env.py                           # Async Alembic environment
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py       # Initial schema creation: gyms, gym_slots, slot_schedules, trainer_gym_assignments
├── tests/
│   ├── __init__.py
│   ├── conftest.py                      # In-memory SQLite async engine, JWT token fixtures
│   ├── test_api_endpoints.py            # HTTP endpoint & RBAC integration tests
│   └── test_slot_service.py             # Domain & repository unit tests
├── .env.example                         # Environment configuration template
├── Dockerfile                           # Multi-stage build, non-root user, healthcheck
├── alembic.ini                          # Alembic migration configuration
├── requirements.txt                     # Pinned microservice dependencies
└── README.md                            # Complete service reference and API documentation
```

---

## 🗄️ Database Schema (`gym_slot`)

### 1. Table: `gyms`
| Column | Type | Constraints / Modifiers |
|---|---|---|
| `id` | `UUID` | Primary Key (server-generated via `uuid.uuid4`) |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE, Indexed (e.g., "C. V. Raman Gym") |
| `location` | `VARCHAR(255)` | NOT NULL |
| `eligibility_group` | `VARCHAR(50)` | NOT NULL, default `'ALL'` (e.g., `'ALL'`, `'BOYS'`, `'GIRLS'`) |
| `is_active` | `BOOLEAN` | NOT NULL, default `true`, Indexed |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`, onupdate |

### 2. Table: `gym_slots`
| Column | Type | Constraints / Modifiers |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `gym_id` | `UUID` | NOT NULL, FK → `gyms.id` ON DELETE CASCADE, Indexed |
| `name` | `VARCHAR(100)` | Nullable (e.g. "Morning Slot 1", "Evening Slot 2") |
| `capacity` | `INTEGER` | NOT NULL, CHECK (`capacity > 0`) |
| `is_active` | `BOOLEAN` | NOT NULL, default `true`, Indexed |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`, onupdate |

### 3. Table: `slot_schedules`
| Column | Type | Constraints / Modifiers |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `slot_id` | `UUID` | NOT NULL, FK → `gym_slots.id` ON DELETE CASCADE, Indexed |
| `day_of_week` | `VARCHAR(20)` | NOT NULL, Indexed (e.g. `MONDAY`, `TUESDAY`, `ALL`) |
| `start_time` | `TIME` | NOT NULL |
| `end_time` | `TIME` | NOT NULL, CHECK (`start_time < end_time`) |
| `effective_from` | `DATE` | Nullable |
| `effective_until`| `DATE` | Nullable |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`, onupdate |

### 4. Table: `trainer_gym_assignments`
| Column | Type | Constraints / Modifiers |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `trainer_id` | `UUID` | NOT NULL, Indexed (Logical ref to Identity Service user — no cross-DB FK) |
| `gym_id` | `UUID` | NOT NULL, FK → `gyms.id` ON DELETE CASCADE, Indexed |
| `effective_from` | `DATE` | Nullable |
| `effective_until`| `DATE` | Nullable |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`, onupdate |

---

## 📡 REST API Reference

| Method | Path | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service liveness & DB connection check |
| `POST` | `/gyms` | `ADMIN`, `SUPER_ADMIN` | Create a new gym facility |
| `GET` | `/gyms` | Any Authenticated | List all gym facilities (supports `skip`, `limit`, `is_active`) |
| `GET` | `/gyms/{gym_id}` | Any Authenticated | Get gym details with its nested slots and schedules |
| `PATCH` | `/gyms/{gym_id}` | `ADMIN`, `SUPER_ADMIN` | Update gym details / active status |
| `POST` | `/slots` | `ADMIN`, `SUPER_ADMIN` | Create a new gym slot with capacity ceiling & optional schedules |
| `GET` | `/slots` | Any Authenticated | List gym slots (supports filtering by `gym_id` and `is_active`) |
| `GET` | `/slots/{slot_id}` | Any Authenticated | Get slot details and attached schedules |
| `PATCH` | `/slots/{slot_id}` | `ADMIN`, `SUPER_ADMIN` | Update slot name, capacity, or active state |
| `DELETE` | `/slots/{slot_id}` | `ADMIN`, `SUPER_ADMIN` | Delete a gym slot |
| `POST` | `/slots/{slot_id}/schedules` | `ADMIN`, `SUPER_ADMIN` | Add a day-of-week timing to a slot |
| `DELETE` | `/schedules/{schedule_id}` | `ADMIN`, `SUPER_ADMIN` | Remove a schedule timing |
| `POST` | `/trainers/assignments` | `ADMIN`, `SUPER_ADMIN` | Assign a trainer to a gym facility |
| `GET` | `/trainers/assignments` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | List trainer-to-gym assignments |
| `DELETE` | `/trainers/assignments/{id}` | `ADMIN`, `SUPER_ADMIN` | Unassign a trainer from a gym |

*(Note: Endpoints are available both directly and prefixed with `/api/v1` for gateway compatibility)*

---

## 🧪 Testing

Run all automated unit and integration tests:

```bash
cd services/slot-service
pytest tests/ -v
```
