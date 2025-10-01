from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Appointment, AppointmentStatus, Pet, Service, User
from app.schemas.appointment import (
    AppointmentClient,
    AppointmentCreate,
    AppointmentPet,
    AppointmentRead,
    AppointmentService,
    AppointmentUpdate,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _build_response(appointment: Appointment) -> AppointmentRead:
    pet = appointment.pet
    client = pet.client if pet else None
    service = appointment.service
    return AppointmentRead(
        id=appointment.id,
        pet_id=appointment.pet_id,
        service_id=appointment.service_id,
        date=appointment.date,
        time=appointment.time,
        status=appointment.status.value,
        notes=appointment.notes,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
        pet=AppointmentPet(id=pet.id, name=pet.name) if pet else None,
        client=AppointmentClient(id=client.id, name=client.name) if client else None,
        service=AppointmentService(id=service.id, name=service.name, price=float(service.price)) if service else None,
    )


@router.get("/", response_model=list[AppointmentRead])
async def list_appointments(
    start_date: date = Query(..., alias="start"),
    end_date: date = Query(..., alias="end"),
    service_id: uuid.UUID | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AppointmentRead]:
    stmt = (
        select(Appointment)
        .where(
            Appointment.user_id == current_user.id,
            Appointment.date >= start_date,
            Appointment.date <= end_date,
        )
        .options(
            selectinload(Appointment.pet).selectinload(Pet.client),
            selectinload(Appointment.service),
        )
        .order_by(Appointment.date.asc(), Appointment.time.asc())
    )
    if service_id:
        stmt = stmt.where(Appointment.service_id == service_id)
    result = await session.execute(stmt)
    appointments = result.scalars().all()
    return [_build_response(appt) for appt in appointments]


@router.post("/", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentRead:
    pet = await session.get(Pet, payload.pet_id)
    if not pet or pet.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pet invalido")

    service = None
    if payload.service_id:
        service = await session.get(Service, payload.service_id)
        if not service or service.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Servico invalido")

    try:
        status_enum = AppointmentStatus(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status invalido") from exc

    appointment = Appointment(
        user_id=current_user.id,
        pet_id=payload.pet_id,
        service_id=payload.service_id,
        date=payload.date,
        time=payload.time,
        status=status_enum,
        notes=payload.notes,
    )
    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return _build_response(appointment)


async def _get_appointment(session: AsyncSession, user_id: uuid.UUID, appointment_id: uuid.UUID) -> Appointment | None:
    result = await session.execute(
        select(Appointment)
        .where(Appointment.id == appointment_id, Appointment.user_id == user_id)
        .options(
            selectinload(Appointment.pet).selectinload(Pet.client),
            selectinload(Appointment.service),
        )
    )
    return result.scalar_one_or_none()


@router.put("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentRead:
    appointment = await _get_appointment(session, current_user.id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")

    values = {}
    if payload.pet_id is not None and payload.pet_id != appointment.pet_id:
        pet = await session.get(Pet, payload.pet_id)
        if not pet or pet.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pet invalido")
        values[Appointment.pet_id] = payload.pet_id
    if payload.service_id is not None:
        if payload.service_id:
            service = await session.get(Service, payload.service_id)
            if not service or service.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Servico invalido")
            values[Appointment.service_id] = payload.service_id
        else:
            values[Appointment.service_id] = None
    if payload.date is not None:
        values[Appointment.date] = payload.date
    if payload.time is not None:
        values[Appointment.time] = payload.time
    if payload.status is not None:
        try:
            values[Appointment.status] = AppointmentStatus(payload.status)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status invalido") from exc
    if payload.notes is not None:
        values[Appointment.notes] = payload.notes

    if values:
        await session.execute(update(Appointment).where(Appointment.id == appointment_id).values(values))
        await session.commit()
        await session.refresh(appointment)
    return _build_response(appointment)


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        delete(Appointment).where(Appointment.id == appointment_id, Appointment.user_id == current_user.id)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")
    await session.commit()
