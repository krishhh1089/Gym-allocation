"""
Custom domain exceptions for the Attendance Service.
"""


class AttendanceSessionNotFoundError(Exception):
    """Raised when an attendance session cannot be found."""
    pass


class SessionNotOpenError(Exception):
    """Raised when check-in is attempted outside the session's permissible window."""
    pass


class SessionCancelledError(Exception):
    """Raised when check-in is attempted for a cancelled session."""
    pass


class AttendanceRecordNotFoundError(Exception):
    """Raised when an attendance record cannot be found."""
    pass


class DuplicateAttendanceError(Exception):
    """Raised when a student has already recorded attendance for the session."""
    pass


class InvalidTokenError(Exception):
    """Raised when a QR token is invalid, expired, or revoked."""
    pass


class ExemptionAlreadyExistsError(Exception):
    """Raised when an exemption already exists for the student in this session."""
    pass


class ExemptionNotFoundError(Exception):
    """Raised when an exemption record is not found."""
    pass


class AttendanceCorrectionError(Exception):
    """Raised when a correction fails validation or invariants."""
    pass


class AbsencePolicyNotFoundError(Exception):
    """Raised when an active absence policy is missing."""
    pass
