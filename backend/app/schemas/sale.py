from datetime import datetime
from uuid import UUID

from app.schemas.base import APIModel


class SaleItemInput(APIModel):
    type: str
    product_id: UUID | None = None
    service_id: UUID | None = None
    name: str
    price: float
    quantity: float
    total: float
    discount: float = 0
    surcharge: float = 0


class SaleCreate(APIModel):
    client_id: UUID | None = None
    client_name: str | None = None
    payment_method: str | None = None
    notes: str | None = None
    items: list[SaleItemInput]
    subtotal: float
    discount: float = 0
    surcharge: float = 0
    total: float


class SaleItemRead(APIModel):
    id: UUID
    type: str
    product_id: UUID | None = None
    service_id: UUID | None = None
    name: str
    price: float
    quantity: float
    total: float
    discount: float
    surcharge: float


class SaleRead(APIModel):
    id: UUID
    user_id: UUID
    client_id: UUID | None
    client_name: str | None
    sale_date: datetime
    subtotal: float
    discount: float
    surcharge: float
    total: float
    type: str
    payment_method: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    client: dict | None = None


class SaleDetail(SaleRead):
    items: list[SaleItemRead]
