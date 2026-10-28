"""
FastAPI application entry-point for the GymSlot Identity Service.

Responsibilities handled here:
  • Application factory with lifespan (startup / shutdown hooks).
  • CORS middleware configuration.
  • API router registration under /api/v1.
  • Global exception handlers.
  • Health check endpoint.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.roles import router as roles_router
from app.api.users import router as users_router
from app.config import settings
from app.database import AsyncSessionLocal


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: seed default roles idempotently.
    Shutdown: dispose the database engine connection pool.
    """
    from app.database import engine
    from app.services.user_service import UserService

    async with AsyncSessionLocal() as session:
        svc = UserService(session)
        await svc.seed_roles()
        await session.commit()

    yield  # ── application runs ──

    await engine.dispose()


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="GymSlot — Identity Service",
        description=(
            "Handles Google OAuth 2.0 authentication, JWT issuance, "
            "user provisioning, and role-based access control for GymSlot."
        ),
        version="1.0.0",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.is_development else [],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    API_PREFIX = "/api/v1"
    app.include_router(auth_router, prefix=API_PREFIX)
    app.include_router(users_router, prefix=API_PREFIX)
    app.include_router(roles_router, prefix=API_PREFIX)

    # ── Global exception handlers ─────────────────────────────────────────────

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred. Please try again later."},
        )

    # ── Health check ──────────────────────────────────────────────────────────

    @app.get("/health", tags=["Health"], summary="Service liveness check")
    async def health():
        return {"status": "ok", "service": "identity-service"}

    return app


app = create_app()
