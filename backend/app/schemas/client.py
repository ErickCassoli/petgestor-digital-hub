from datetime import datetime
from uuid import UUID

from pydantic import EmailStr

from app.schemas.base import APIModel


class PetSummary(APIModel):
    id: UUID
    name: str
    type: str
    breed: str | None = None
    age: int | None = None


class ClientBase(APIModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(APIModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class ClientRead(ClientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    pets: list[PetSummary] = []
