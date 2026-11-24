"""
Custom exceptions for the Student Service.
"""


class StudentNotFoundError(Exception):
    """Raised when a student record cannot be found."""
    pass


class DuplicateRegistrationNumberError(Exception):
    """Raised when registration number is already taken."""
    pass


class DuplicateEmailError(Exception):
    """Raised when email is already associated with another student."""
    pass


class StudentAccessDeniedError(Exception):
    """Raised when a student tries to access another student's record."""
    pass


class InvalidStatusTransitionError(Exception):
    """Raised on an invalid account status transition."""
    pass
