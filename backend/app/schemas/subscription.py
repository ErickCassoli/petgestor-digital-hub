from datetime import datetime
from uuid import UUID

from app.schemas.base import APIModel


class PriceInfo(APIModel):
    id: str
    unit_amount: int
    currency: str


class SubscriptionPrices(APIModel):
    monthly: PriceInfo | None = None
    trimestral: PriceInfo | None = None
    semestral: PriceInfo | None = None


class SubscriptionData(APIModel):
    id: str
    status: str
    currentPeriodStart: int
    currentPeriodEnd: int
    cancelAtPeriodEnd: bool
    priceId: str
    amount: float
    currency: str
    interval: str | None = None
    intervalCount: int | None = None


class SubscriptionStatusResponse(APIModel):
    isSubscribed: bool
    trialActive: bool
    subscriptionData: SubscriptionData | None = None


class CheckoutRequest(APIModel):
    price_id: str
    return_url: str


class CheckoutResponse(APIModel):
    session_id: str
    url: str
