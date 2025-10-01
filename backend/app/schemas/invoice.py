from datetime import datetime
from uuid import UUID

from app.schemas.base import APIModel


class InvoiceItemInput(APIModel):
    service_id: UUID
    quantity: int
    unit_price: float
    subtotal: float


class InvoiceCreate(APIModel):
    discount_amount: float = 0
    surcharge_amount: float = 0
    final_amount: float
    items: list[InvoiceItemInput]


class InvoiceItemRead(APIModel):
    id: UUID
    service_id: UUID | None
    quantity: int
    unit_price: float
    subtotal: float
    service_name: str | None = None


class InvoiceRead(APIModel):
    id: UUID
    appointment_id: UUID
    pet_id: UUID | None
    client_id: UUID | None
    discount_amount: float
    surcharge_amount: float
    final_amount: float
    created_at: datetime
    items: list[InvoiceItemRead]
