"""
Custom domain exceptions for the Slot Service.
"""


class GymNotFoundError(Exception):
    """Raised when a gym facility is not found."""
    pass


class DuplicateGymNameError(Exception):
    """Raised when a gym with the given name already exists."""
    pass


class SlotNotFoundError(Exception):
    """Raised when a gym slot is not found."""
    pass


class ScheduleNotFoundError(Exception):
    """Raised when a slot schedule is not found."""
    pass


class TrainerAssignmentNotFoundError(Exception):
    """Raised when a trainer gym assignment is not found."""
    pass


class InvalidScheduleTimeError(Exception):
    """Raised when schedule start_time >= end_time."""
    pass
