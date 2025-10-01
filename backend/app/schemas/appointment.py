from datetime import date, datetime, time
from uuid import UUID

from app.schemas.base import APIModel


class AppointmentPet(APIModel):
    id: UUID
    name: str


class AppointmentClient(APIModel):
    id: UUID
    name: str


class AppointmentService(APIModel):
    id: UUID
    name: str
    price: float | None = None


class AppointmentBase(APIModel):
    pet_id: UUID
    service_id: UUID | None = None
    date: date
    time: time
    status: str = "pending"
    notes: str | None = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(APIModel):
    pet_id: UUID | None = None
    service_id: UUID | None = None
    date: date | None = None
    time: time | None = None
    status: str | None = None
    notes: str | None = None


class AppointmentRead(AppointmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    pet: AppointmentPet | None = None
    client: AppointmentClient | None = None
    service: AppointmentService | None = None
