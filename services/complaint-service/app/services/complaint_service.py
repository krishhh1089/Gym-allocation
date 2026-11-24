import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from app.exceptions.complaint_exceptions import (
    ComplaintNotFoundError,
    InvalidStatusTransitionError,
    SupportRequestNotFoundError,
)
from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintComment,
    ComplaintPriority,
    ComplaintStatus,
    SupportCategory,
    SupportRequest,
    SupportStatus,
)
from app.repositories.complaint_repository import ComplaintRepository


class ComplaintService:
    def __init__(self, repository: ComplaintRepository):
        self.repo = repository

    # ---------------------------------------------------------------------------
    # Complaints
    # ---------------------------------------------------------------------------

    async def create_complaint(
        self,
        student_id: uuid.UUID,
        submitted_by: uuid.UUID,
        category: ComplaintCategory,
        title: str,
        description: str,
        priority: ComplaintPriority = ComplaintPriority.MEDIUM,
    ) -> Complaint:
        return await self.repo.create_complaint(
            student_id=student_id,
            submitted_by=submitted_by,
            category=category,
            title=title,
            description=description,
            priority=priority,
        )

    async def get_complaint(self, complaint_id: uuid.UUID) -> Complaint:
        complaint = await self.repo.get_complaint_by_id(complaint_id)
        if not complaint:
            raise ComplaintNotFoundError(f"Complaint {complaint_id} not found")
        return complaint

    async def list_complaints(
        self,
        student_id: Optional[uuid.UUID] = None,
        category: Optional[ComplaintCategory] = None,
        status: Optional[ComplaintStatus] = None,
        priority: Optional[ComplaintPriority] = None,
        assigned_to: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[Complaint], int]:
        return await self.repo.list_complaints(
            student_id=student_id,
            category=category,
            status=status,
            priority=priority,
            assigned_to=assigned_to,
            page=page,
            size=size,
        )

    async def update_status(
        self,
        complaint_id: uuid.UUID,
        status: ComplaintStatus,
        resolution_notes: Optional[str] = None,
    ) -> Complaint:
        complaint = await self.get_complaint(complaint_id)
        if complaint.status == ComplaintStatus.CLOSED and status == ComplaintStatus.OPEN:
            raise InvalidStatusTransitionError("Cannot reopen a closed complaint directly")

        resolved_at = datetime.now(timezone.utc) if status in (ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED) else None
        updated = await self.repo.update_status(
            complaint_id=complaint_id,
            status=status,
            resolution_notes=resolution_notes,
            resolved_at=resolved_at,
        )
        return updated  # type: ignore

    async def assign_complaint(
        self,
        complaint_id: uuid.UUID,
        assigned_to: uuid.UUID,
    ) -> Complaint:
        complaint = await self.get_complaint(complaint_id)
        updated = await self.repo.assign_complaint(complaint_id, assigned_to)
        return updated  # type: ignore

    async def add_comment(
        self,
        complaint_id: uuid.UUID,
        user_id: uuid.UUID,
        comment: str,
    ) -> ComplaintComment:
        await self.get_complaint(complaint_id)
        return await self.repo.add_comment(
            complaint_id=complaint_id,
            user_id=user_id,
            comment=comment,
        )

    # ---------------------------------------------------------------------------
    # Support Requests
    # ---------------------------------------------------------------------------

    async def create_support_request(
        self,
        student_id: uuid.UUID,
        category: SupportCategory,
        title: str,
        description: str,
    ) -> SupportRequest:
        return await self.repo.create_support_request(
            student_id=student_id,
            category=category,
            title=title,
            description=description,
        )

    async def get_support_request(self, request_id: uuid.UUID) -> SupportRequest:
        req = await self.repo.get_support_request_by_id(request_id)
        if not req:
            raise SupportRequestNotFoundError(f"Support request {request_id} not found")
        return req

    async def list_support_requests(
        self,
        student_id: Optional[uuid.UUID] = None,
        category: Optional[SupportCategory] = None,
        status: Optional[SupportStatus] = None,
        assigned_to: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[SupportRequest], int]:
        return await self.repo.list_support_requests(
            student_id=student_id,
            category=category,
            status=status,
            assigned_to=assigned_to,
            page=page,
            size=size,
        )

    async def update_support_request(
        self,
        request_id: uuid.UUID,
        status: Optional[SupportStatus] = None,
        resolution: Optional[str] = None,
        assigned_to: Optional[uuid.UUID] = None,
    ) -> SupportRequest:
        await self.get_support_request(request_id)
        updated = await self.repo.update_support_request(
            request_id=request_id,
            status=status,
            resolution=resolution,
            assigned_to=assigned_to,
        )
        return updated  # type: ignore
