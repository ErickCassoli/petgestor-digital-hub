from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Profile, User
from app.schemas.subscription import CheckoutRequest, CheckoutResponse, SubscriptionPrices, SubscriptionStatusResponse
from app.services import stripe_service

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/prices", response_model=SubscriptionPrices)
async def get_prices() -> SubscriptionPrices:
    return stripe_service.get_subscription_prices()


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
) -> CheckoutResponse:
    if not current_user.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario sem e-mail cadastrado")
    return stripe_service.create_subscription_checkout(current_user.email, payload)


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_status(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionStatusResponse:
    if not current_user.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario sem e-mail cadastrado")
    status_response = stripe_service.get_subscription_status(current_user.email)

    await session.execute(
        update(Profile)
        .where(Profile.user_id == current_user.id)
        .values(is_subscribed=status_response.isSubscribed)
    )
    await session.commit()
    return status_response
