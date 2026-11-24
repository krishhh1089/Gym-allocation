# 🎓 GymSlot — Student Service

The **Student Service** manages student profiles, photo change requests, and student account lifecycle for the GymSlot platform. It is a FastAPI microservice with its own PostgreSQL database (`gym_student`) and communicates with other services only via JWT claims and domain events — no cross-database foreign keys.

---

## Architecture

```
app/
├── main.py              # FastAPI application factory, lifespan, CORS, health check
├── config.py            # Pydantic Settings (env-var driven)
├── database.py          # Async SQLAlchemy engine + session factory
├── models/
│   ├── base.py          # TimestampMixin + uuid_pk helper
│   └── student.py       # Student, PhotoChangeRequest, AccountStatus enum
├── schemas/
│   └── student.py       # Pydantic request/response schemas
├── repositories/
│   └── student_repository.py  # All DB access; no raw SQL outside here
├── services/
│   └── student_service.py     # Business logic, duplicate checks, pagination
├── api/
│   ├── deps.py          # get_db, get_current_user, require_roles
│   └── students.py      # REST endpoints with RBAC guards
└── exceptions/
    └── student_exceptions.py  # Custom domain exceptions
migrations/
├── env.py               # Async Alembic environment
└── versions/
    └── 0001_initial_schema.py
tests/
├── conftest.py          # In-memory SQLite fixtures, JWT helpers
├── test_api_endpoints.py
└── test_student_service.py
```

---

## Database Schema

### Table: `students`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, server-generated |
| `identity_user_id` | UUID | nullable, indexed (logical ref to Identity Service) |
| `registration_number` | VARCHAR(50) | NOT NULL, UNIQUE, indexed |
| `full_name` | VARCHAR(255) | NOT NULL |
| `email` | VARCHAR(320) | NOT NULL, UNIQUE, indexed |
| `department` | VARCHAR(100) | NOT NULL |
| `programme` | VARCHAR(100) | NOT NULL |
| `academic_year` | INTEGER | NOT NULL |
| `semester` | INTEGER | NOT NULL |
| `phone_number` | VARCHAR(20) | nullable |
| `profile_photo_url` | VARCHAR(1024) | nullable |
| `account_status` | ENUM | NOT NULL, default=PENDING; values: PENDING, ACTIVE, SUSPENDED |
| `created_at` | TIMESTAMPTZ | NOT NULL, server_default=now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, server_default=now(), onupdate |

### Table: `photo_change_requests`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `student_id` | UUID | NOT NULL, indexed |
| `requested_photo_url` | VARCHAR(1024) | NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, default=PENDING; values: PENDING, APPROVED, REJECTED |
| `reviewed_by` | UUID | nullable |
| `decision_reason` | VARCHAR(500) | nullable |
| `decided_at` | VARCHAR | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL asyncpg URL: `postgresql+asyncpg://...` |
| `SECRET_KEY` | `change-me` | Shared JWT signing secret (same as Identity Service) |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS allowed origins |
| `APP_ENV` | `development` | `development` enables `/docs` and verbose logging |
| `SERVICE_NAME` | `student-service` | Returned in health check |
| `SERVICE_VERSION` | `1.0.0` | Returned in health check |

Copy `.env.example` → `.env` and fill in real values.

---

## API Endpoints

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service liveness + DB connectivity check |
| `POST` | `/students` | ADMIN, SUPER_ADMIN | Provision a new student profile |
| `GET` | `/students` | ADMIN, SUPER_ADMIN, TRAINER | List students (paginated + filters) |
| `GET` | `/students/me` | STUDENT | Get own profile (matched by JWT `sub`) |
| `GET` | `/students/{student_id}` | ADMIN, SUPER_ADMIN, TRAINER | Get a student by ID |
| `PATCH` | `/students/me` | STUDENT | Update own phone/photo (limited fields) |
| `PATCH` | `/students/{student_id}` | ADMIN, SUPER_ADMIN | Full admin update of a student |
| `PATCH` | `/students/{student_id}/status` | ADMIN, SUPER_ADMIN | Update account status |

### Query Parameters (GET /students)

| Param | Type | Description |
|---|---|---|
| `skip` | int (≥0) | Pagination offset (default 0) |
| `limit` | int (1-100) | Page size (default 20, max 100) |
| `department` | string | Filter by department (case-insensitive) |
| `programme` | string | Filter by programme (case-insensitive) |
| `status` | PENDING\|ACTIVE\|SUSPENDED | Filter by account status |
| `search` | string | Case-insensitive search on name or reg number |

---

## Auth / RBAC

- JWT is extracted from the `Authorization: Bearer <token>` header.
- The token is verified using the shared `SECRET_KEY` (same key as the Identity Service).
- Claims extracted: `sub` (UUID → `identity_user_id`), `email`, `roles`, `status`.
- **STUDENT** can only view/update their own profile (matched via `identity_user_id == JWT sub`).
- **TRAINER** has read-only access to student profiles.
- **ADMIN / SUPER_ADMIN** have full CRUD access.
- Role enforcement is applied at the FastAPI dependency layer — never trust client-supplied identity.

---

## Migration Commands

```bash
cd services/student-service

# Apply all migrations to the database
alembic upgrade head

# Check current migration state (requires live DB)
alembic current

# Generate a new auto-migration
alembic revision --autogenerate -m "describe_change"

# Roll back one step
alembic downgrade -1
```

---

## Docker Commands

```bash
# Build the image
docker build -t gym-student-service .

# Run standalone (with an external DB)
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://gym:gym@host.docker.internal:5432/gym_student \
  -e SECRET_KEY=your-secret-key \
  gym-student-service

# Start with docker-compose from repo root
docker-compose up student-service
```

---

## Test Commands

```bash
cd services/student-service

# Install dependencies
pip install -r requirements.txt

# Run all tests (verbose)
pytest tests/ -v

# Run with coverage
pytest tests/ -v --tb=short

# Run only service tests
pytest tests/test_student_service.py -v

# Run only API tests
pytest tests/test_api_endpoints.py -v
```

---

## Example curl Requests

```bash
# Health check
curl http://localhost:8002/health

# Create a student (admin JWT required)
curl -X POST http://localhost:8002/students \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_number": "AP21110010001",
    "full_name": "Jane Doe",
    "email": "jane.doe@srmap.edu.in",
    "department": "CSE",
    "programme": "B.Tech",
    "academic_year": 2,
    "semester": 3,
    "phone_number": "9876543210"
  }'

# List students
curl http://localhost:8002/students?skip=0&limit=20 \
  -H "Authorization: Bearer <admin_jwt>"

# Search students
curl "http://localhost:8002/students?search=Jane&department=CSE" \
  -H "Authorization: Bearer <admin_jwt>"

# Get a specific student
curl http://localhost:8002/students/<student_uuid> \
  -H "Authorization: Bearer <admin_jwt>"

# Get own profile (student)
curl http://localhost:8002/students/me \
  -H "Authorization: Bearer <student_jwt>"

# Update own profile (student)
curl -X PATCH http://localhost:8002/students/me \
  -H "Authorization: Bearer <student_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9000000001"}'

# Update student status (admin)
curl -X PATCH http://localhost:8002/students/<student_uuid>/status \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"account_status": "ACTIVE"}'
```
