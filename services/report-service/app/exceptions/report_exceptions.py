"""
Custom domain exceptions for the Report Service.
"""


class ReportNotFoundError(Exception):
    """Raised when a report cannot be found."""
    pass


class ReportJobNotFoundError(Exception):
    """Raised when a report job cannot be found."""
    pass


class AuditLogNotFoundError(Exception):
    """Raised when an audit log entry cannot be found."""
    pass


class ReportGenerationError(Exception):
    """Raised when report generation or serialization fails."""
    pass
