# 🔔 GymSlot — Notification Service

The **Notification Service** is the central multi-channel communication engine for the GymSlot platform at SRM University-AP.

It manages user notifications across multiple delivery channels (in-app, email, SMS, push), idempotent message deduplication, general and role-targeted announcements, message templating with dynamic placeholder interpolation, and durable delivery job retries with dead-letter queueing.

It is an async FastAPI microservice owning the `gym_notification` database, communicating with other services strictly via REST APIs and JWT claims — **no cross-database foreign keys**.

---

## 🏗️ Architecture

```
services/notification-service/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI factory, lifespan, health check
│   ├── config.py                        # Pydantic Settings supporting .env aliases & extra=ignore
│   ├── database.py                      # Async SQLAlchemy engine + session generator (get_db)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                      # TimestampMixin and uuid_pk helper
│   │   └── notification.py              # Notification, NotificationTemplate, Announcement, NotificationJob
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── notification.py              # Request/response models, validators, CurrentUser
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── notification_repository.py   # All async database queries
│   ├── services/
│   │   ├── __init__.py
│   │   └── notification_service.py      # Domain business logic: deduplication, templating,
│   │                                    # immediate in-app delivery, job queueing & retries
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                      # get_db, get_current_user (JWT decode), require_roles RBAC
│   │   └── notifications.py             # REST endpoints for notifications, announcements, templates, jobs
│   └── exceptions/
│       ├── __init__.py
│       └── notification_exceptions.py   # Domain exceptions (NotificationNotFound, TemplateRenderError)
├── migrations/
│   ├── env.py                           # Async Alembic environment
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py       # Initial schema creation: notifications, templates,
│                                        # announcements, notification_jobs
├── tests/
│   ├── __init__.py
│   ├── conftest.py                      # In-memory SQLite async engine, JWT fixtures
│   ├── test_api_endpoints.py            # HTTP endpoint & RBAC integration tests
│   └── test_notification_service.py     # Domain & repository unit tests
├── .env.example                         # Environment configuration template
├── Dockerfile                           # Multi-stage build, non-root user, healthcheck
├── alembic.ini                          # Alembic migration configuration
├── requirements.txt                     # Pinned microservice dependencies
└── README.md                            # Complete service reference and API documentation
```

---

## 🗄️ Database Schema (`gym_notification`)

1. **`notifications`**: User notification entity (`user_id`, `type: ALLOCATION_CONFIRMED | WAITLIST_PROMOTED | ABSENCE_WARNING | TERMINATION_NOTICE | PHOTO_STATUS | TRANSFER_STATUS | ANNOUNCEMENT | GENERAL`, `channel: IN_APP | EMAIL | SMS | PUSH`, `subject`, `message`, `status: PENDING | SENT | FAILED | READ`, `sent_at`, `read_at`, `deduplication_key`).
   - Unique `deduplication_key` guarantees idempotency across system events and retries.
2. **`notification_templates`**: Reusable notification templates with placeholder syntax (`code`, `channel`, `subject_template`, `body_template`, `is_active`).
3. **`announcements`**: Broadcast messages (`title`, `content`, `target_role: ALL | STUDENT | TRAINER`, `author_id`, `is_published`).
4. **`notification_jobs`**: Durable delivery tracking (`notification_id`, `retry_count`, `max_retries`, `next_attempt_at`, `error_message`, `status: QUEUED | PROCESSING | SUCCESS | DEAD_LETTER`).

---

## 🔒 Security & RBAC Matrix

| Endpoint | Method | Roles Permitted | Description |
|---|---|---|---|
| `/health` | GET | Public | Service liveness and DB connectivity check |
| `/notifications` | POST | `ADMIN`, `SUPER_ADMIN` | Send/enqueue notification with deduplication |
| `/notifications/me` | GET | Authenticated | List current user's notifications & unread count |
| `/notifications/{id}/read` | PATCH | Authenticated | Mark personal notification as read |
| `/notifications/read-all` | POST | Authenticated | Mark all personal unread notifications as read |
| `/notifications` | GET | `ADMIN`, `SUPER_ADMIN` | Filter all notifications across the system |
| `/notifications/{id}` | GET | Owner / `ADMIN` | View notification details |
| `/announcements` | POST | `ADMIN`, `SUPER_ADMIN` | Publish a new announcement |
| `/announcements` | GET | Authenticated | View published announcements |
| `/announcements/{id}` | GET | Authenticated | View announcement details |
| `/announcements/{id}` | DELETE | `ADMIN`, `SUPER_ADMIN` | Delete/unpublish an announcement |
| `/templates` | POST | `ADMIN`, `SUPER_ADMIN` | Create a message template |
| `/templates` | GET | `ADMIN`, `SUPER_ADMIN` | List message templates |
| `/templates/{code}` | GET | `ADMIN`, `SUPER_ADMIN` | Get template details |
| `/templates/{code}` | PUT | `ADMIN`, `SUPER_ADMIN` | Update message template |
| `/jobs` | GET | `ADMIN`, `SUPER_ADMIN` | Inspect delivery queues and dead-letter jobs |
| `/jobs/{id}/retry` | POST | `ADMIN`, `SUPER_ADMIN` | Requeue failed/dead-letter job |

---

## 🧪 Testing

The service includes comprehensive automated test coverage with in-memory SQLite and mock JWT claims:

```bash
# Run all Notification Service tests
$env:PYTHONPATH="services/notification-service"
python -m pytest services/notification-service/tests -v
```

All 13 tests pass cleanly covering immediate in-app delivery, email job queueing, deduplication key idempotency, template rendering, unread count tracking, announcement lifecycle, job retries, and user privacy isolation.
