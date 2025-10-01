from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Appointment, Client, Pet, Service, User
from app.schemas.pet import ClientMini, PetCreate, PetHistoryEntry, PetRead, PetUpdate

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("/", response_model=list[PetRead])
async def list_pets(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PetRead]:
    result = await session.execute(
        select(Pet)
        .where(Pet.user_id == current_user.id)
        .options(selectinload(Pet.client))
        .order_by(Pet.name.asc())
    )
    pets = result.scalars().all()
    return [
        PetRead(
            id=pet.id,
            name=pet.name,
            type=pet.type,
            breed=pet.breed,
            age=pet.age,
            notes=pet.notes,
            client_id=pet.client_id,
            created_at=pet.created_at,
            updated_at=pet.updated_at,
            client=ClientMini(id=pet.client.id, name=pet.client.name) if pet.client else None,
        )
        for pet in pets
    ]


@router.post("/", response_model=PetRead, status_code=status.HTTP_201_CREATED)
async def create_pet(
    payload: PetCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PetRead:
    client = await session.get(Client, payload.client_id)
    if not client or client.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cliente invalido")
    pet = Pet(
        user_id=current_user.id,
        client_id=payload.client_id,
        name=payload.name,
        type=payload.type,
        breed=payload.breed,
        age=payload.age,
        notes=payload.notes,
    )
    session.add(pet)
    await session.commit()
    await session.refresh(pet)
    return PetRead(
        id=pet.id,
        name=pet.name,
        type=pet.type,
        breed=pet.breed,
        age=pet.age,
        notes=pet.notes,
        client_id=pet.client_id,
        created_at=pet.created_at,
        updated_at=pet.updated_at,
        client=ClientMini(id=client.id, name=client.name),
    )


async def _get_pet(session: AsyncSession, user_id: uuid.UUID, pet_id: uuid.UUID) -> Pet | None:
    result = await session.execute(
        select(Pet).where(Pet.id == pet_id, Pet.user_id == user_id).options(selectinload(Pet.client))
    )
    return result.scalar_one_or_none()


@router.put("/{pet_id}", response_model=PetRead)
async def update_pet(
    pet_id: uuid.UUID,
    payload: PetUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PetRead:
    pet = await _get_pet(session, current_user.id, pet_id)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet nao encontrado")

    values = {}
    if payload.name is not None:
        values[Pet.name] = payload.name
    if payload.type is not None:
        values[Pet.type] = payload.type
    if payload.breed is not None:
        values[Pet.breed] = payload.breed
    if payload.age is not None:
        values[Pet.age] = payload.age
    if payload.notes is not None:
        values[Pet.notes] = payload.notes
    if payload.client_id is not None and payload.client_id != pet.client_id:
        client = await session.get(Client, payload.client_id)
        if not client or client.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cliente invalido")
        values[Pet.client_id] = payload.client_id
    if values:
        await session.execute(update(Pet).where(Pet.id == pet_id).values(values))
        await session.commit()
        await session.refresh(pet)

    return PetRead(
        id=pet.id,
        name=pet.name,
        type=pet.type,
        breed=pet.breed,
        age=pet.age,
        notes=pet.notes,
        client_id=pet.client_id,
        created_at=pet.created_at,
        updated_at=pet.updated_at,
        client=ClientMini(id=pet.client.id, name=pet.client.name) if pet.client else None,
    )


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        delete(Pet).where(Pet.id == pet_id, Pet.user_id == current_user.id)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet nao encontrado")
    await session.commit()


@router.get("/{pet_id}/history", response_model=list[PetHistoryEntry])
async def pet_history(
    pet_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PetHistoryEntry]:
    pet = await _get_pet(session, current_user.id, pet_id)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet nao encontrado")

    result = await session.execute(
        select(Appointment)
        .where(Appointment.pet_id == pet_id, Appointment.user_id == current_user.id)
        .options(selectinload(Appointment.service))
        .order_by(Appointment.date.desc())
    )
    appointments = result.scalars().all()
    entries: list[PetHistoryEntry] = []
    for appt in appointments:
        service_name = appt.service.name if appt.service else None
        entries.append(
            PetHistoryEntry(
                id=appt.id,
                date=appt.date,
                status=appt.status.value,
                notes=appt.notes,
                service=service_name,
            )
        )
    return entries
