# Re-export all models so Alembic's env.py can import Base.metadata
# and discover every table via a single import.

from app.models.base import Base  # noqa: F401
from app.models.student import AccountStatus, PhotoChangeRequest, Student  # noqa: F401

__all__ = [
    "Base",
    "Student",
    "AccountStatus",
    "PhotoChangeRequest",
]
