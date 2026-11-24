"""
Domain service for Registration Windows, Applications, FCFS Waitlists, Allocations,
Gym Card Tokens, and Slot Transfers.
"""

import hashlib
import secrets
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.exceptions.allocation_exceptions import (
    ActiveAllocationConflictError,
    AllocationNotFoundError,
    ApplicationNotFoundError,
    DuplicateApplicationError,
    InvalidTransferRequestError,
    RegistrationWindowClosedError,
    RegistrationWindowNotFoundError,
    SlotCapacityNotFoundError,
    SlotChangeRequestNotFoundError,
    SlotFullError,
    TokenInvalidOrExpiredError,
)
from app.models.allocation import (
    Allocation,
    Application,
    GymCardToken,
    RegistrationWindow,
    SlotCapacity,
    SlotChangeRequest,
)
from app.models.base import utcnow
from app.repositories.allocation_repository import AllocationRepository
from app.schemas.allocation import (
    AllocationListResponse,
    AllocationResponse,
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    GymCardTokenResponse,
    GymCardVerifyResponse,
    RegistrationWindowCreate,
    RegistrationWindowListResponse,
    RegistrationWindowResponse,
    RegistrationWindowUpdate,
    SlotCapacityResponse,
    SlotCapacitySet,
    SlotChangeRequestCreate,
    SlotChangeRequestListResponse,
    SlotChangeRequestResponse,
    SlotChangeRequestReview,
    WaitlistPositionResponse,
)


def _to_window_response(w: RegistrationWindow) -> RegistrationWindowResponse:
    return RegistrationWindowResponse.model_validate(w)


def _to_app_response(a: Application) -> ApplicationResponse:
    return ApplicationResponse.model_validate(a)


def _to_alloc_response(al: Allocation) -> AllocationResponse:
    return AllocationResponse.model_validate(al)


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class AllocationService:

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = AllocationRepository(session)

    # ── Registration Windows ──────────────────────────────────────────────────

    async def create_window(
        self, payload: RegistrationWindowCreate, created_by: Optional[uuid.UUID] = None
    ) -> RegistrationWindow:
        window = RegistrationWindow(
            name=payload.name.strip(),
            opens_at=payload.opens_at,
            closes_at=payload.closes_at,
            daily_open_time=payload.daily_open_time,
            daily_close_time=payload.daily_close_time,
            timezone=payload.timezone,
            status=payload.status,
            created_by=created_by,
        )
        return await self._repo.create_window(window)

    async def get_window(self, window_id: uuid.UUID) -> RegistrationWindow:
        window = await self._repo.get_window(window_id)
        if window is None:
            raise RegistrationWindowNotFoundError(
                f"Registration window '{window_id}' not found."
            )
        return window

    async def list_windows(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
    ) -> RegistrationWindowListResponse:
        limit = min(limit, 100)
        items, total = await self._repo.list_windows(
            skip=skip, limit=limit, status=status
        )
        return RegistrationWindowListResponse(
            items=[_to_window_response(w) for w in items],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_window(
        self, window_id: uuid.UUID, payload: RegistrationWindowUpdate
    ) -> RegistrationWindow:
        await self.get_window(window_id)
        data = payload.model_dump(exclude_unset=True)
        updated = await self._repo.update_window(window_id, data)
        return updated

    # ── Slot Capacity ─────────────────────────────────────────────────────────

    async def set_slot_capacity(
        self, payload: SlotCapacitySet
    ) -> SlotCapacityResponse:
        cap = await self._repo.upsert_capacity(
            payload.slot_id, payload.max_capacity
        )
        return SlotCapacityResponse.model_validate(cap)

    async def get_slot_capacity(self, slot_id: uuid.UUID) -> SlotCapacityResponse:
        cap = await self._repo.get_capacity(slot_id)
        if cap is None:
            raise SlotCapacityNotFoundError(
                f"Capacity for slot '{slot_id}' not configured."
            )
        return SlotCapacityResponse.model_validate(cap)

    # ── Applications & FCFS Booking ───────────────────────────────────────────

    async def apply_for_slot(
        self, student_id: uuid.UUID, payload: ApplicationCreate
    ) -> Application:
        # 1. Validate registration window is currently open
        window = await self.get_window(payload.registration_window_id)
        now = utcnow()
        if not window.is_currently_open(now):
            raise RegistrationWindowClosedError(
                f"Registration window '{window.name}' is currently closed."
            )

        # 2. Check if student already holds an active allocation
        active_alloc = await self._repo.get_active_allocation_by_student(student_id)
        if active_alloc is not None:
            raise ActiveAllocationConflictError(
                "You already have an active gym allocation. "
                "Submit a slot transfer request instead of a new application."
            )

        # 3. Check for existing active application in this window
        existing_app = await self._repo.get_active_student_application(
            student_id, window.id
        )
        if existing_app is not None:
            raise DuplicateApplicationError(
                f"You already have an application in this window (status: {existing_app.status})."
            )

        # 4. Atomic capacity evaluation
        cap = await self._repo.get_capacity(payload.slot_id, for_update=True)
        if cap is None:
            # Default fallback capacity if not explicitly initialized
            cap = await self._repo.upsert_capacity(payload.slot_id, max_capacity=30)

        # Server-generated priority timestamp
        app_obj = Application(
            student_id=student_id,
            slot_id=payload.slot_id,
            registration_window_id=payload.registration_window_id,
            applied_at_utc=now,
            priority_sequence=cap.allocated_count + cap.waitlisted_count + 1,
        )

        if cap.allocated_count < cap.max_capacity:
            # Immediate Allocation
            cap.allocated_count += 1
            app_obj.status = "APPROVED"
            created_app = await self._repo.create_application(app_obj)

            # Create active allocation
            start_d = date.today()
            end_d = window.closes_at.date() if window.closes_at else (start_d + timedelta(days=90))
            if end_d <= start_d:
                end_d = start_d + timedelta(days=90)

            allocation = Allocation(
                student_id=student_id,
                slot_id=payload.slot_id,
                application_id=created_app.id,
                status="ACTIVE",
                start_date=start_d,
                end_date=end_d,
            )
            await self._repo.create_allocation(allocation)
        else:
            # Waitlist Queue
            cap.waitlisted_count += 1
            app_obj.status = "WAITLISTED"
            created_app = await self._repo.create_application(app_obj)

        return created_app

    async def get_waitlist_position(
        self, student_id: uuid.UUID, application_id: uuid.UUID
    ) -> WaitlistPositionResponse:
        app_obj = await self._repo.get_application(application_id)
        if app_obj is None or app_obj.student_id != student_id:
            raise ApplicationNotFoundError("Application not found.")

        cap = await self._repo.get_capacity(app_obj.slot_id)
        total_waitlisted = cap.waitlisted_count if cap else 0

        if app_obj.status != "WAITLISTED":
            return WaitlistPositionResponse(
                application_id=app_obj.id,
                slot_id=app_obj.slot_id,
                status=app_obj.status,
                waitlist_position=None,
                total_waitlisted=total_waitlisted,
            )

        position = await self._repo.get_waitlist_position(
            app_obj.slot_id, app_obj.applied_at_utc, app_obj.priority_sequence
        )
        return WaitlistPositionResponse(
            application_id=app_obj.id,
            slot_id=app_obj.slot_id,
            status=app_obj.status,
            waitlist_position=position,
            total_waitlisted=total_waitlisted,
        )

    # ── Gym Card Dynamic QR Tokens ────────────────────────────────────────────

    async def generate_card_token(self, student_id: uuid.UUID) -> GymCardTokenResponse:
        alloc = await self._repo.get_active_allocation_by_student(student_id)
        if alloc is None:
            raise AllocationNotFoundError("No active allocation found for this student.")

        # Revoke previous tokens for this allocation to ensure single active QR
        await self._repo.revoke_tokens_for_allocation(alloc.id)

        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)
        expires_at = utcnow() + timedelta(minutes=settings.qr_token_ttl_minutes)

        token_obj = GymCardToken(
            student_id=student_id,
            allocation_id=alloc.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        await self._repo.create_card_token(token_obj)

        return GymCardTokenResponse(
            token=raw_token,
            token_hash=token_hash,
            expires_at=expires_at,
            allocation_id=alloc.id,
            student_id=student_id,
        )

    async def verify_card_token(self, raw_token: str) -> GymCardVerifyResponse:
        token_hash = _hash_token(raw_token)
        token_obj = await self._repo.get_token_by_hash(token_hash)
        if token_obj is None:
            return GymCardVerifyResponse(is_valid=False, message="Invalid token.")

        if token_obj.revoked_at is not None:
            return GymCardVerifyResponse(is_valid=False, message="Token has been revoked.")

        expires_at = token_obj.expires_at
        now = utcnow()
        if expires_at.tzinfo is None and now.tzinfo is not None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at:
            return GymCardVerifyResponse(is_valid=False, message="Token has expired.")

        alloc = await self._repo.get_allocation(token_obj.allocation_id)
        if alloc is None or alloc.status != "ACTIVE":
            return GymCardVerifyResponse(
                is_valid=False, message="No active allocation associated with this token."
            )

        return GymCardVerifyResponse(
            is_valid=True,
            student_id=token_obj.student_id,
            allocation_id=token_obj.allocation_id,
            slot_id=alloc.slot_id,
            message="Token is valid.",
        )

    # ── Slot Transfers ────────────────────────────────────────────────────────

    async def request_slot_transfer(
        self, student_id: uuid.UUID, payload: SlotChangeRequestCreate
    ) -> SlotChangeRequest:
        alloc = await self._repo.get_allocation(payload.current_allocation_id)
        if alloc is None or alloc.student_id != student_id or alloc.status != "ACTIVE":
            raise AllocationNotFoundError(
                "Must possess an active allocation to request a slot transfer."
            )

        if alloc.slot_id == payload.requested_slot_id:
            raise InvalidTransferRequestError(
                "Requested slot cannot be identical to current allocated slot."
            )

        existing_pending = await self._repo.get_pending_transfer_by_student(student_id)
        if existing_pending is not None:
            raise InvalidTransferRequestError(
                "You already have a pending transfer request awaiting review."
            )

        req = SlotChangeRequest(
            student_id=student_id,
            current_allocation_id=alloc.id,
            requested_slot_id=payload.requested_slot_id,
            reason=payload.reason,
            status="PENDING",
        )
        return await self._repo.create_transfer_request(req)

    async def review_slot_transfer(
        self,
        req_id: uuid.UUID,
        payload: SlotChangeRequestReview,
        reviewer_id: uuid.UUID,
    ) -> SlotChangeRequest:
        req = await self._repo.get_transfer_request(req_id)
        if req is None:
            raise SlotChangeRequestNotFoundError(
                f"Transfer request '{req_id}' not found."
            )
        if req.status != "PENDING":
            raise InvalidTransferRequestError(
                f"Cannot review request already marked as '{req.status}'."
            )

        now = utcnow()
        req.reviewed_by = reviewer_id
        req.reviewed_at = now

        if payload.action == "REJECT":
            req.status = "REJECTED"
            await self._session.flush()
            return req

        # APPROVAL FLOW
        old_alloc = await self._repo.get_allocation(req.current_allocation_id)
        if old_alloc is None or old_alloc.status != "ACTIVE":
            raise AllocationNotFoundError("Current allocation is no longer active.")

        # Check capacity for requested slot
        target_cap = await self._repo.get_capacity(
            req.requested_slot_id, for_update=True
        )
        if target_cap is None or target_cap.allocated_count >= target_cap.max_capacity:
            raise SlotFullError(
                "Cannot approve transfer: Target slot is currently at maximum capacity."
            )

        # 1. Update capacities
        old_cap = await self._repo.get_capacity(old_alloc.slot_id, for_update=True)
        if old_cap and old_cap.allocated_count > 0:
            old_cap.allocated_count -= 1

        target_cap.allocated_count += 1

        # 2. Mark old allocation as TRANSFERRED
        old_alloc.status = "TRANSFERRED"
        await self._repo.revoke_tokens_for_allocation(old_alloc.id)

        # 3. Create new allocation
        new_alloc = Allocation(
            student_id=req.student_id,
            slot_id=req.requested_slot_id,
            status="ACTIVE",
            start_date=date.today(),
            end_date=old_alloc.end_date,
        )
        await self._repo.create_allocation(new_alloc)

        # 4. Promote next waitlisted applicant from old slot if exists!
        if old_cap and old_cap.waitlisted_count > 0:
            next_waitlist = await self._repo.get_next_waitlisted_application(
                old_alloc.slot_id
            )
            if next_waitlist:
                old_cap.waitlisted_count -= 1
                old_cap.allocated_count += 1
                next_waitlist.status = "APPROVED"
                promoted_alloc = Allocation(
                    student_id=next_waitlist.student_id,
                    slot_id=old_alloc.slot_id,
                    application_id=next_waitlist.id,
                    status="ACTIVE",
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=90),
                )
                await self._repo.create_allocation(promoted_alloc)

        req.status = "APPROVED"
        await self._session.flush()
        return req
