from datetime import date, datetime
from uuid import UUID

from app.schemas.base import APIModel


class ClientMini(APIModel):
    id: UUID
    name: str


class PetBase(APIModel):
    name: str
    type: str
    breed: str | None = None
    age: int | None = None
    notes: str | None = None


class PetCreate(PetBase):
    client_id: UUID


class PetUpdate(APIModel):
    name: str | None = None
    type: str | None = None
    breed: str | None = None
    age: int | None = None
    notes: str | None = None
    client_id: UUID | None = None


class PetRead(PetBase):
    id: UUID
    client_id: UUID
    created_at: datetime
    updated_at: datetime
    client: ClientMini | None = None


class PetHistoryEntry(APIModel):
    id: UUID
    date: date
    status: str
    notes: str | None = None
    service: str | None = None
