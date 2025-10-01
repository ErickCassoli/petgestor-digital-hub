from datetime import datetime
from uuid import UUID

from app.schemas.base import APIModel


class ServiceBase(APIModel):
    name: str
    description: str | None = None
    price: float


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(APIModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None


class ServiceRead(ServiceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
