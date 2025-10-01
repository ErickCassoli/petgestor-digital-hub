from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Client, Pet, User
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate, PetSummary

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("/", response_model=list[ClientRead])
async def list_clients(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ClientRead]:
    result = await session.execute(
        select(Client)
        .where(Client.user_id == current_user.id)
        .options(selectinload(Client.pets))
        .order_by(Client.name.asc())
    )
    clients = result.scalars().all()
    return [
        ClientRead(
            id=client.id,
            name=client.name,
            email=client.email,
            phone=client.phone,
            address=client.address,
            created_at=client.created_at,
            updated_at=client.updated_at,
            pets=[
                PetSummary(id=pet.id, name=pet.name, type=pet.type, breed=pet.breed, age=pet.age)
                for pet in client.pets
            ],
        )
        for client in clients
    ]


@router.post("/", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    client = Client(
        user_id=current_user.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
    )
    session.add(client)
    await session.commit()
    await session.refresh(client)
    return ClientRead(
        id=client.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        address=client.address,
        created_at=client.created_at,
        updated_at=client.updated_at,
        pets=[],
    )


async def _get_client_for_user(session: AsyncSession, user_id: uuid.UUID, client_id: uuid.UUID) -> Client | None:
    result = await session.execute(
        select(Client)
        .where(Client.id == client_id, Client.user_id == user_id)
        .options(selectinload(Client.pets))
    )
    return result.scalar_one_or_none()


@router.put("/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: uuid.UUID,
    payload: ClientUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    client = await _get_client_for_user(session, current_user.id, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente nao encontrado")

    values = {}
    if payload.name is not None:
        values[Client.name] = payload.name
    if payload.email is not None:
        values[Client.email] = payload.email
    if payload.phone is not None:
        values[Client.phone] = payload.phone
    if payload.address is not None:
        values[Client.address] = payload.address
    if values:
        values[Client.updated_at] = datetime.now(timezone.utc)
        await session.execute(update(Client).where(Client.id == client_id).values(values))
        await session.commit()
        await session.refresh(client)

    return ClientRead(
        id=client.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        address=client.address,
        created_at=client.created_at,
        updated_at=client.updated_at,
        pets=[
            PetSummary(id=pet.id, name=pet.name, type=pet.type, breed=pet.breed, age=pet.age)
            for pet in client.pets
        ],
    )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        delete(Client).where(Client.id == client_id, Client.user_id == current_user.id)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente nao encontrado")
    await session.commit()
