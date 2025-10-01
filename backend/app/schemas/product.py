from datetime import datetime
from uuid import UUID

from app.schemas.base import APIModel


class ProductBase(APIModel):
    name: str
    price: float
    stock: float = 0
    min_stock: float | None = None
    description: str | None = None
    category: str | None = None
    type: int = 1


class ProductCreate(ProductBase):
    pass


class ProductUpdate(APIModel):
    name: str | None = None
    price: float | None = None
    stock: float | None = None
    min_stock: float | None = None
    description: str | None = None
    category: str | None = None
    type: int | None = None


class ProductRead(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
