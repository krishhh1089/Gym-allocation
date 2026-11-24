"""
Custom domain exceptions for the Allocation Service.
"""


class RegistrationWindowNotFoundError(Exception):
    """Raised when a registration window is not found."""
    pass


class RegistrationWindowClosedError(Exception):
    """Raised when trying to apply while the registration window is not open."""
    pass


class SlotCapacityNotFoundError(Exception):
    """Raised when capacity for a slot has not been configured."""
    pass


class SlotFullError(Exception):
    """Raised when a slot is at maximum capacity."""
    pass


class ApplicationNotFoundError(Exception):
    """Raised when an application is not found."""
    pass


class DuplicateApplicationError(Exception):
    """Raised when a student already has an active application or allocation for this window."""
    pass


class AllocationNotFoundError(Exception):
    """Raised when an allocation is not found."""
    pass


class ActiveAllocationConflictError(Exception):
    """Raised when a student already possesses an active allocation."""
    pass


class SlotChangeRequestNotFoundError(Exception):
    """Raised when a slot transfer request is not found."""
    pass


class InvalidTransferRequestError(Exception):
    """Raised when a slot transfer request is invalid or contradictory."""
    pass


class TokenInvalidOrExpiredError(Exception):
    """Raised when an attendance QR token is invalid, expired, or revoked."""
    pass
