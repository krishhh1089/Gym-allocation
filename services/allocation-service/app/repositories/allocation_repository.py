"""
Repository layer for Allocation Service.
All async queries for windows, capacity, applications, allocations, gym card tokens, and transfers.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.allocation import (
    Allocation,
    Application,
    GymCardToken,
    RegistrationWindow,
    SlotCapacity,
    SlotChangeRequest,
)


class AllocationRepository:

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Registration Windows ──────────────────────────────────────────────────

    async def create_window(
        self, window: RegistrationWindow
    ) -> RegistrationWindow:
        self._session.add(window)
        await self._session.flush()
        await self._session.refresh(window)
        return window

    async def get_window(
        self, window_id: uuid.UUID
    ) -> Optional[RegistrationWindow]:
        result = await self._session.execute(
            select(RegistrationWindow).where(RegistrationWindow.id == window_id)
        )
        return result.scalar_one_or_none()

    async def list_windows(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
    ) -> tuple[list[RegistrationWindow], int]:
        base_query = select(RegistrationWindow)
        if status:
            base_query = base_query.where(RegistrationWindow.status == status.upper())

        count_result = await self._session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self._session.execute(
            base_query.order_by(RegistrationWindow.opens_at.desc())
            .offset(skip)
            .limit(limit)
        )
        windows = list(result.scalars().all())
        return windows, total

    async def update_window(
        self, window_id: uuid.UUID, data: dict
    ) -> Optional[RegistrationWindow]:
        window = await self.get_window(window_id)
        if window is None:
            return None
        for key, value in data.items():
            if hasattr(window, key) and value is not None:
                setattr(window, key, value)
        self._session.add(window)
        await self._session.flush()
        await self._session.refresh(window)
        return window

    # ── Slot Capacity ─────────────────────────────────────────────────────────

    async def get_capacity(
        self, slot_id: uuid.UUID, for_update: bool = False
    ) -> Optional[SlotCapacity]:
        query = select(SlotCapacity).where(SlotCapacity.slot_id == slot_id)
        if for_update:
            query = query.with_for_update()
        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def upsert_capacity(
        self, slot_id: uuid.UUID, max_capacity: int
    ) -> SlotCapacity:
        capacity = await self.get_capacity(slot_id)
        if capacity is None:
            capacity = SlotCapacity(slot_id=slot_id, max_capacity=max_capacity)
            self._session.add(capacity)
        else:
            capacity.max_capacity = max_capacity
        await self._session.flush()
        await self._session.refresh(capacity)
        return capacity

    # ── Applications ──────────────────────────────────────────────────────────

    async def create_application(self, application: Application) -> Application:
        self._session.add(application)
        await self._session.flush()
        await self._session.refresh(application)
        return application

    async def get_application(self, app_id: uuid.UUID) -> Optional[Application]:
        result = await self._session.execute(
            select(Application).where(Application.id == app_id)
        )
        return result.scalar_one_or_none()

    async def get_active_student_application(
        self, student_id: uuid.UUID, window_id: uuid.UUID
    ) -> Optional[Application]:
        result = await self._session.execute(
            select(Application).where(
                Application.student_id == student_id,
                Application.registration_window_id == window_id,
                Application.status.in_(["PENDING", "APPROVED", "WAITLISTED", "OFFERED"]),
            )
        )
        return result.scalar_one_or_none()

    async def list_applications(
        self,
        skip: int = 0,
        limit: int = 20,
        slot_id: Optional[uuid.UUID] = None,
        student_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
    ) -> tuple[list[Application], int]:
        base_query = select(Application)
        if slot_id is not None:
            base_query = base_query.where(Application.slot_id == slot_id)
        if student_id is not None:
            base_query = base_query.where(Application.student_id == student_id)
        if status is not None:
            base_query = base_query.where(Application.status == status.upper())

        count_result = await self._session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self._session.execute(
            base_query.order_by(
                Application.applied_at_utc.asc(),
                Application.priority_sequence.asc(),
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_waitlist_position(
        self, slot_id: uuid.UUID, applied_at: datetime, priority_seq: int
    ) -> int:
        """Count earlier waitlisted applicants for the slot."""
        result = await self._session.execute(
            select(func.count())
            .select_from(Application)
            .where(
                Application.slot_id == slot_id,
                Application.status == "WAITLISTED",
                (Application.applied_at_utc < applied_at)
                | (
                    (Application.applied_at_utc == applied_at)
                    & (Application.priority_sequence < priority_seq)
                ),
            )
        )
        return result.scalar_one() + 1  # 1-indexed rank

    async def get_next_waitlisted_application(
        self, slot_id: uuid.UUID
    ) -> Optional[Application]:
        result = await self._session.execute(
            select(Application)
            .where(
                Application.slot_id == slot_id,
                Application.status == "WAITLISTED",
            )
            .order_by(
                Application.applied_at_utc.asc(),
                Application.priority_sequence.asc(),
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def update_application(
        self, app_id: uuid.UUID, data: dict
    ) -> Optional[Application]:
        app = await self.get_application(app_id)
        if app is None:
            return None
        for key, value in data.items():
            if hasattr(app, key) and value is not None:
                setattr(app, key, value)
        self._session.add(app)
        await self._session.flush()
        await self._session.refresh(app)
        return app

    # ── Allocations ───────────────────────────────────────────────────────────

    async def create_allocation(self, allocation: Allocation) -> Allocation:
        self._session.add(allocation)
        await self._session.flush()
        await self._session.refresh(allocation)
        return allocation

    async def get_allocation(self, alloc_id: uuid.UUID) -> Optional[Allocation]:
        result = await self._session.execute(
            select(Allocation).where(Allocation.id == alloc_id)
        )
        return result.scalar_one_or_none()

    async def get_active_allocation_by_student(
        self, student_id: uuid.UUID
    ) -> Optional[Allocation]:
        result = await self._session.execute(
            select(Allocation).where(
                Allocation.student_id == student_id,
                Allocation.status == "ACTIVE",
            )
        )
        return result.scalar_one_or_none()

    async def list_allocations(
        self,
        skip: int = 0,
        limit: int = 20,
        student_id: Optional[uuid.UUID] = None,
        slot_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
    ) -> tuple[list[Allocation], int]:
        base_query = select(Allocation)
        if student_id is not None:
            base_query = base_query.where(Allocation.student_id == student_id)
        if slot_id is not None:
            base_query = base_query.where(Allocation.slot_id == slot_id)
        if status is not None:
            base_query = base_query.where(Allocation.status == status.upper())

        count_result = await self._session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self._session.execute(
            base_query.order_by(Allocation.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def update_allocation(
        self, alloc_id: uuid.UUID, data: dict
    ) -> Optional[Allocation]:
        alloc = await self.get_allocation(alloc_id)
        if alloc is None:
            return None
        for key, value in data.items():
            if hasattr(alloc, key) and value is not None:
                setattr(alloc, key, value)
        self._session.add(alloc)
        await self._session.flush()
        await self._session.refresh(alloc)
        return alloc

    # ── Gym Card Tokens ───────────────────────────────────────────────────────

    async def create_card_token(self, token_obj: GymCardToken) -> GymCardToken:
        self._session.add(token_obj)
        await self._session.flush()
        await self._session.refresh(token_obj)
        return token_obj

    async def get_token_by_hash(self, token_hash: str) -> Optional[GymCardToken]:
        result = await self._session.execute(
            select(GymCardToken).where(GymCardToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke_tokens_for_allocation(self, allocation_id: uuid.UUID) -> None:
        result = await self._session.execute(
            select(GymCardToken).where(
                GymCardToken.allocation_id == allocation_id,
                GymCardToken.revoked_at.is_(None),
            )
        )
        for t in result.scalars().all():
            t.revoked_at = datetime.utcnow()
            self._session.add(t)
        await self._session.flush()

    # ── Slot Change / Transfer Requests ───────────────────────────────────────

    async def create_transfer_request(
        self, req: SlotChangeRequest
    ) -> SlotChangeRequest:
        self._session.add(req)
        await self._session.flush()
        await self._session.refresh(req)
        return req

    async def get_transfer_request(
        self, req_id: uuid.UUID
    ) -> Optional[SlotChangeRequest]:
        result = await self._session.execute(
            select(SlotChangeRequest).where(SlotChangeRequest.id == req_id)
        )
        return result.scalar_one_or_none()

    async def get_pending_transfer_by_student(
        self, student_id: uuid.UUID
    ) -> Optional[SlotChangeRequest]:
        result = await self._session.execute(
            select(SlotChangeRequest).where(
                SlotChangeRequest.student_id == student_id,
                SlotChangeRequest.status == "PENDING",
            )
        )
        return result.scalar_one_or_none()

    async def list_transfer_requests(
        self,
        skip: int = 0,
        limit: int = 20,
        student_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
    ) -> tuple[list[SlotChangeRequest], int]:
        base_query = select(SlotChangeRequest)
        if student_id is not None:
            base_query = base_query.where(SlotChangeRequest.student_id == student_id)
        if status is not None:
            base_query = base_query.where(SlotChangeRequest.status == status.upper())

        count_result = await self._session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        result = await self._session.execute(
            base_query.order_by(SlotChangeRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def update_transfer_request(
        self, req_id: uuid.UUID, data: dict
    ) -> Optional[SlotChangeRequest]:
        req = await self.get_transfer_request(req_id)
        if req is None:
            return None
        for key, value in data.items():
            if hasattr(req, key) and value is not None:
                setattr(req, key, value)
        self._session.add(req)
        await self._session.flush()
        await self._session.refresh(req)
        return req
