# Report & Analytics Service

The **Report & Analytics Service** is an administrative and analytical microservice within the GymSlot architecture. It manages asynchronous report generation, CSV data exports, operational dashboard metrics, and centralized audit logging for all critical platform events.

## Features

- **Report Generation**: On-demand asynchronous report generation for Allocation Rosters, Attendance Summaries, Capacity Utilization, Absence Rosters, and Platform Audit Logs.
- **CSV Data Streaming**: Direct download of formatted tabular data reports with standard `Content-Disposition` attachment headers.
- **Operational Analytics**: Aggregated dashboard statistics providing active slot allocations, daily check-in volume, open complaints, and aggregate capacity utilization.
- **Centralized Audit Logging**: Immutable chronological record of administrative actions, status transitions, before/after state diffs, and actor correlation tracking.
- **Strict Isolation**: Self-contained PostgreSQL schema (`gym_report`) with zero cross-database foreign key constraints.

## Tech Stack

- **Runtime**: Python 3.11+
- **Framework**: FastAPI (async)
- **ORM**: SQLAlchemy 2.0 (asyncio + asyncpg)
- **Migrations**: Alembic
- **Authentication**: JWT verification via shared secret key (RBAC: `TRAINER`, `ADMIN`, `SUPER_ADMIN`)
- **Testing**: Pytest, pytest-asyncio, HTTPX, SQLite in-memory (`aiosqlite`)

## API Endpoints

### Health
- `GET /health` - Health check probe

### Reports
- `POST /reports` - Request report generation (`ADMIN`, `SUPER_ADMIN`)
- `GET /reports` - List reports with filtering and pagination (`ADMIN`, `SUPER_ADMIN`)
- `GET /reports/{id}` - Retrieve report metadata (`ADMIN`, `SUPER_ADMIN`)
- `GET /reports/{id}/download` - Download generated CSV file (`ADMIN`, `SUPER_ADMIN`)
- `DELETE /reports/{id}` - Delete generated report metadata (`ADMIN`, `SUPER_ADMIN`)

### Operational Analytics
- `GET /analytics/summary` - Retrieve operational dashboard KPI summary (`TRAINER`, `ADMIN`, `SUPER_ADMIN`)

### Audit Logs
- `POST /audit-logs` - Record an audit event entry (`ADMIN`, `SUPER_ADMIN`)
- `GET /audit-logs` - Search and filter audit log history (`ADMIN`, `SUPER_ADMIN`)
- `GET /audit-logs/{id}` - Inspect specific audit log record (`ADMIN`, `SUPER_ADMIN`)

## Running Tests

```bash
python -m pytest services/report-service/tests -v
```
