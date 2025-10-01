from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Service, User
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=list[ServiceRead])
async def list_services(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ServiceRead]:
    result = await session.execute(
        select(Service).where(Service.user_id == current_user.id).order_by(Service.name.asc())
    )
    services = result.scalars().all()
    return [
        ServiceRead(
            id=svc.id,
            name=svc.name,
            description=svc.description,
            price=float(svc.price),
            created_at=svc.created_at,
            updated_at=svc.updated_at,
        )
        for svc in services
    ]


@router.post("/", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: ServiceCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ServiceRead:
    service = Service(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
    )
    session.add(service)
    await session.commit()
    await session.refresh(service)
    return ServiceRead(
        id=service.id,
        name=service.name,
        description=service.description,
        price=float(service.price),
        created_at=service.created_at,
        updated_at=service.updated_at,
    )


async def _get_service(session: AsyncSession, user_id: uuid.UUID, service_id: uuid.UUID) -> Service | None:
    result = await session.execute(
        select(Service).where(Service.id == service_id, Service.user_id == user_id)
    )
    return result.scalar_one_or_none()


@router.put("/{service_id}", response_model=ServiceRead)
async def update_service(
    service_id: uuid.UUID,
    payload: ServiceUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ServiceRead:
    service = await _get_service(session, current_user.id, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servico nao encontrado")

    values = {}
    if payload.name is not None:
        values[Service.name] = payload.name
    if payload.description is not None:
        values[Service.description] = payload.description
    if payload.price is not None:
        values[Service.price] = payload.price
    if values:
        values[Service.updated_at] = datetime.now(timezone.utc)
        await session.execute(update(Service).where(Service.id == service_id).values(values))
        await session.commit()
        await session.refresh(service)

    return ServiceRead(
        id=service.id,
        name=service.name,
        description=service.description,
        price=float(service.price),
        created_at=service.created_at,
        updated_at=service.updated_at,
    )


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        delete(Service).where(Service.id == service_id, Service.user_id == current_user.id)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servico nao encontrado")
    await session.commit()
