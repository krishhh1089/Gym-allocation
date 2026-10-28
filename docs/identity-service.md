# Identity Service — Complete Architecture & Reference

> **Service Path:** `services/identity-service/`  
> **Database:** PostgreSQL (`gym_identity`)  
> **Port:** `8001`  
> **Documentation Version:** 1.0.0

This document explains everything that has been designed, implemented, migrated, and verified for the **Identity Service**.

---

## 1. What Was Completed

| Component | Files | Description |
|---|---|---|
| **Data Models** | [`app/models/user.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/models/user.py), [`app/models/role.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/models/role.py), [`app/models/base.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/models/base.py) | Defines SQLAlchemy 2.0 async models for `User`, `ExternalIdentity`, `AuthSession`, `Role`, and `UserRole`. |
| **Pydantic Schemas** | [`app/schemas/user.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/schemas/user.py), [`app/schemas/auth.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/schemas/auth.py) | Schemas for user provisioning, updates, token responses, JWT payloads, and OAuth state. |
| **Repository Layer** | [`app/repositories/user_repository.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/repositories/user_repository.py) | Encapsulates all database queries (`UserRepository`, `RoleRepository`) using async queries with eager relationship loading. |
| **Authentication Service** | [`app/services/auth_service.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/services/auth_service.py) | Implements Google OAuth 2.0 code exchange, domain allowlist enforcement, provisioned user account matching, JWT issuance, and session revocation. |
| **User Service** | [`app/services/user_service.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/services/user_service.py) | Implements user provisioning with email normalization, duplicate prevention, paginated listing, status updates, and idempotent role assignments. |
| **API Dependencies** | [`app/api/deps.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/api/deps.py) | Provides `get_db`, `get_current_user` (JWT validation), and `require_roles` RBAC factory. |
| **API Routers** | [`app/api/auth.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/api/auth.py), [`app/api/users.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/api/users.py), [`app/api/roles.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/api/roles.py) | Exposes endpoints for authentication, current user inspection, admin user provisioning, and role assignment. |
| **Application Factory** | [`app/main.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/app/main.py) | Creates FastAPI application with lifespan management (seeds default roles at startup, gracefully closes connection pool on shutdown), CORS, and `/health`. |
| **Alembic Migrations** | [`migrations/env.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/migrations/env.py), [`migrations/versions/0001_initial_schema.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/migrations/versions/0001_initial_schema.py) | Async migration environment and migration script creating all 5 tables with constraints and indexes. |
| **Containerization** | [`Dockerfile`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/Dockerfile), [`.env.example`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/.env.example) | Multi-stage Dockerfile running as non-root user with health check probe. |
| **Automated Tests** | [`tests/conftest.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/tests/conftest.py), [`tests/test_api_endpoints.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/tests/test_api_endpoints.py), [`tests/test_auth_service.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/tests/test_auth_service.py), [`tests/test_user_service.py`](file:///c:/Users/gauta/Documents/Gym-allocation/services/identity-service/tests/test_user_service.py) | 19 automated tests running against in-memory SQLite with 100% pass rate. |

---

## 2. Security & Policy Enforcement

1. **Google OAuth 2.0**:
   - CSRF protection: Generates a high-entropy `state` parameter and stores it in an `HttpOnly`, `SameSite=Lax` cookie.
   - Code exchange: Directly queries Google's OAuth2 endpoints (`/token` and `/userinfo`) using `httpx`.
   - Domain validation: Requires `email_verified == True` from Google and checks the domain against `ALLOWED_EMAIL_DOMAINS` (default: `srmap.edu.in`).
2. **Account Provisioning Rule**:
   - Users cannot sign up freely. An account must first be provisioned by an administrator (`status="PENDING"` or `"ACTIVE"`).
   - On first Google login, the user's Google subject ID (`sub`) is linked as an `ExternalIdentity`, and their email is marked as verified.
3. **Session & JWT Security**:
   - Short-lived JWTs (default 60 minutes) contain: `sub` (User UUID), `email`, `roles`, and `status`.
   - Server-side `auth_sessions` table stores a SHA-256 hash of the session token.
   - Logging out (`POST /auth/logout`) soft-revokes all active sessions for the user.
4. **Role Guards**:
   - `STUDENT`, `TRAINER`, `ADMIN`, `SUPER_ADMIN` are pre-seeded.
   - User creation and updates are restricted to `ADMIN` and `SUPER_ADMIN`.
   - Role assignment and revocation are restricted to `SUPER_ADMIN`.

---

## 3. Test Verification Results

All 19 tests run with `pytest tests/`:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.3, pytest-9.1.1, pluggy-1.6.0
collected 19 items

tests\test_api_endpoints.py .......                                      [ 36%]
tests\test_auth_service.py ......                                        [ 68%]
tests\test_user_service.py ......                                        [100%]

============================= 19 passed in 0.99s ==============================
```
