"""
Custom domain exceptions for the Complaint Service.
"""


class ComplaintNotFoundError(Exception):
    """Raised when a complaint record cannot be found."""
    pass


class SupportRequestNotFoundError(Exception):
    """Raised when a support request cannot be found."""
    pass


class InvalidStatusTransitionError(Exception):
    """Raised when an invalid status transition is attempted."""
    pass


class UnauthorizedActionError(Exception):
    """Raised when an unauthorized user attempts to modify or view a complaint."""
    pass
