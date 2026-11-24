from app.exceptions.student_exceptions import (  # noqa: F401
    DuplicateEmailError,
    DuplicateRegistrationNumberError,
    InvalidStatusTransitionError,
    StudentAccessDeniedError,
    StudentNotFoundError,
)

__all__ = [
    "StudentNotFoundError",
    "DuplicateRegistrationNumberError",
    "DuplicateEmailError",
    "StudentAccessDeniedError",
    "InvalidStatusTransitionError",
]
