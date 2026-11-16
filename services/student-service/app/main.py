"""
FastAPI application entry-point for the GymSlot Student Service.

Responsibilities handled here:
  • Application factory with lifespan (startup / shutdown hooks).
  • CORS middleware configuration.
  • API router registration.
  • Global exception handlers.
  • Health check endpoint.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.students import router as students_router
from app.config import settings
from app.database import AsyncSessionLocal


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: verify DB connection.
    Shutdown: dispose the database engine connection pool.
    """
    from app.database import engine
    from sqlalchemy import text

    # Verify DB connectivity on startup
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning(
            f"Database connection check failed at startup: {exc}"
        )

    yield  # ── application runs ──

    await engine.dispose()


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="GymSlot — Student Service",
        description=(
            "Manages student profiles, photo change requests, "
            "and student account lifecycle for GymSlot."
        ),
        version=settings.service_version,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.is_development else settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(students_router)

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
        from app.database import engine
        from sqlalchemy import text

        db_ok = True
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception:
            db_ok = False

        return {
            "status": "ok",
            "service": settings.service_name,
            "version": settings.service_version,
            "database": "ok" if db_ok else "unavailable",
        }

    return app


app = create_app()
