import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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


class ComplaintRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

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
        complaint = Complaint(
            student_id=student_id,
            submitted_by=submitted_by,
            category=category,
            title=title,
            description=description,
            priority=priority,
            status=ComplaintStatus.OPEN,
        )
        self.session.add(complaint)
        await self.session.flush()
        return complaint

    async def get_complaint_by_id(self, complaint_id: uuid.UUID) -> Optional[Complaint]:
        stmt = (
            select(Complaint)
            .options(selectinload(Complaint.comments))
            .where(Complaint.id == complaint_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

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
        conditions = []
        if student_id is not None:
            conditions.append(Complaint.student_id == student_id)
        if category is not None:
            conditions.append(Complaint.category == category)
        if status is not None:
            conditions.append(Complaint.status == status)
        if priority is not None:
            conditions.append(Complaint.priority == priority)
        if assigned_to is not None:
            conditions.append(Complaint.assigned_to == assigned_to)

        count_stmt = select(func.count(Complaint.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(Complaint)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(Complaint.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def update_status(
        self,
        complaint_id: uuid.UUID,
        status: ComplaintStatus,
        resolution_notes: Optional[str] = None,
        resolved_at: Optional[datetime] = None,
    ) -> Optional[Complaint]:
        complaint = await self.get_complaint_by_id(complaint_id)
        if not complaint:
            return None
        complaint.status = status
        if resolution_notes is not None:
            complaint.resolution_notes = resolution_notes
        if resolved_at is not None:
            complaint.resolved_at = resolved_at
        elif status in (ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED):
            complaint.resolved_at = datetime.now(timezone.utc)
        await self.session.flush()
        return complaint

    async def assign_complaint(
        self,
        complaint_id: uuid.UUID,
        assigned_to: uuid.UUID,
    ) -> Optional[Complaint]:
        complaint = await self.get_complaint_by_id(complaint_id)
        if not complaint:
            return None
        complaint.assigned_to = assigned_to
        if complaint.status == ComplaintStatus.OPEN:
            complaint.status = ComplaintStatus.IN_PROGRESS
        await self.session.flush()
        return complaint

    async def add_comment(
        self,
        complaint_id: uuid.UUID,
        user_id: uuid.UUID,
        comment: str,
    ) -> ComplaintComment:
        comment_obj = ComplaintComment(
            complaint_id=complaint_id,
            user_id=user_id,
            comment=comment,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(comment_obj)
        complaint = await self.session.get(Complaint, complaint_id)
        if complaint and "comments" in complaint.__dict__:
            complaint.comments.append(comment_obj)
        await self.session.flush()
        return comment_obj

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
        request = SupportRequest(
            student_id=student_id,
            category=category,
            title=title,
            description=description,
            status=SupportStatus.OPEN,
        )
        self.session.add(request)
        await self.session.flush()
        return request

    async def get_support_request_by_id(self, request_id: uuid.UUID) -> Optional[SupportRequest]:
        stmt = select(SupportRequest).where(SupportRequest.id == request_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_support_requests(
        self,
        student_id: Optional[uuid.UUID] = None,
        category: Optional[SupportCategory] = None,
        status: Optional[SupportStatus] = None,
        assigned_to: Optional[uuid.UUID] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[SupportRequest], int]:
        conditions = []
        if student_id is not None:
            conditions.append(SupportRequest.student_id == student_id)
        if category is not None:
            conditions.append(SupportRequest.category == category)
        if status is not None:
            conditions.append(SupportRequest.status == status)
        if assigned_to is not None:
            conditions.append(SupportRequest.assigned_to == assigned_to)

        count_stmt = select(func.count(SupportRequest.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(SupportRequest)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = (
            stmt.order_by(desc(SupportRequest.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def update_support_request(
        self,
        request_id: uuid.UUID,
        status: Optional[SupportStatus] = None,
        resolution: Optional[str] = None,
        assigned_to: Optional[uuid.UUID] = None,
    ) -> Optional[SupportRequest]:
        req = await self.get_support_request_by_id(request_id)
        if not req:
            return None
        if status is not None:
            req.status = status
            if status in (SupportStatus.RESOLVED, SupportStatus.CLOSED):
                req.resolved_at = datetime.now(timezone.utc)
        if resolution is not None:
            req.resolution = resolution
        if assigned_to is not None:
            req.assigned_to = assigned_to
        await self.session.flush()
        return req
