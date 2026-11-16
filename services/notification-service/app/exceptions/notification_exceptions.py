"""
Custom domain exceptions for the Notification Service.
"""


class NotificationNotFoundError(Exception):
    """Raised when a notification record cannot be found."""
    pass


class NotificationTemplateNotFoundError(Exception):
    """Raised when a notification template cannot be found."""
    pass


class AnnouncementNotFoundError(Exception):
    """Raised when an announcement cannot be found."""
    pass


class NotificationJobNotFoundError(Exception):
    """Raised when a delivery job cannot be found."""
    pass


class TemplateRenderError(Exception):
    """Raised when template placeholders cannot be resolved."""
    pass
