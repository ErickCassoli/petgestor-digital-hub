from __future__ import annotations

import logging
from typing import Any

import stripe
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.subscription import (
    CheckoutRequest,
    CheckoutResponse,
    PriceInfo,
    SubscriptionData,
    SubscriptionPrices,
    SubscriptionStatusResponse,
)

logger = logging.getLogger(__name__)


def _get_client() -> None:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe not configured")
    stripe.api_key = settings.stripe_secret_key


def _safe_get_price(price_id: str | None) -> PriceInfo | None:
    if not price_id:
        return None
    try:
        price = stripe.Price.retrieve(price_id)
        return PriceInfo(id=price.id, unit_amount=price.unit_amount or 0, currency=price.currency)
    except Exception as exc:  # pragma: no cover - network call
        logger.error("Stripe price retrieval failed: %s", exc)
        return None


def get_subscription_prices() -> SubscriptionPrices:
    _get_client()
    settings = get_settings()
    return SubscriptionPrices(
        monthly=_safe_get_price(settings.stripe_price_monthly),
        trimestral=_safe_get_price(settings.stripe_price_trimestral),
        semestral=_safe_get_price(settings.stripe_price_semestral),
    )


def create_subscription_checkout(email: str, payload: CheckoutRequest) -> CheckoutResponse:
    _get_client()
    settings = get_settings()
    price_id = payload.price_id or settings.stripe_price_monthly
    if not price_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing price id")

    try:
        customer_id = None
        if email:
            customers = stripe.Customer.list(email=email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{payload.return_url}?success=true",
            cancel_url=f"{payload.return_url}?canceled=true",
            customer=customer_id,
            customer_email=None if customer_id else email,
        )
        return CheckoutResponse(session_id=session.id, url=session.url)
    except Exception as exc:  # pragma: no cover - network call
        logger.exception("Stripe checkout creation failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe error") from exc


def get_subscription_status(email: str) -> SubscriptionStatusResponse:
    _get_client()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing email")
    try:
        customers = stripe.Customer.list(email=email, limit=1)
        if not customers.data:
            return SubscriptionStatusResponse(isSubscribed=False, trialActive=False, subscriptionData=None)

        customer_id = customers.data[0].id
        subscriptions = stripe.Subscription.list(customer=customer_id, status="active", limit=1)
        if not subscriptions.data:
            return SubscriptionStatusResponse(isSubscribed=False, trialActive=False, subscriptionData=None)

        subscription = subscriptions.data[0]
        item = subscription.items.data[0]
        price = item.price
        amount = (price.unit_amount or 0) / 100 if price.unit_amount else 0
        data = SubscriptionData(
            id=subscription.id,
            status=subscription.status,
            currentPeriodStart=subscription.current_period_start,
            currentPeriodEnd=subscription.current_period_end,
            cancelAtPeriodEnd=subscription.cancel_at_period_end,
            priceId=price.id,
            amount=amount,
            currency=price.currency,
            interval=price.recurring.interval if price.recurring else None,
            intervalCount=price.recurring.interval_count if price.recurring else None,
        )
        return SubscriptionStatusResponse(isSubscribed=True, trialActive=False, subscriptionData=data)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - network call
        logger.exception("Stripe status check failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe error") from exc
