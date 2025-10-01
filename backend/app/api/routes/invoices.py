from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import (
    Appointment,
    AppointmentStatus,
    Invoice,
    InvoiceItem,
    Pet,
    Service,
    User,
)
from app.schemas.invoice import InvoiceCreate, InvoiceItemRead, InvoiceRead

router = APIRouter(prefix="/invoices", tags=["invoices"])


async def _get_appointment(
    session: AsyncSession,
    user_id: uuid.UUID,
    appointment_id: uuid.UUID,
) -> Appointment | None:
    result = await session.execute(
        select(Appointment)
        .where(Appointment.id == appointment_id, Appointment.user_id == user_id)
        .options(selectinload(Appointment.pet).selectinload(Pet.client))
    )
    return result.scalar_one_or_none()


def _serialize_invoice(invoice: Invoice) -> InvoiceRead:
    return InvoiceRead(
        id=invoice.id,
        appointment_id=invoice.appointment_id,
        pet_id=invoice.pet_id,
        client_id=invoice.client_id,
        discount_amount=float(invoice.discount_amount),
        surcharge_amount=float(invoice.surcharge_amount),
        final_amount=float(invoice.final_amount),
        created_at=invoice.created_at,
        items=[
            InvoiceItemRead(
                id=item.id,
                service_id=item.service_id,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                subtotal=float(item.subtotal),
                service_name=item.service.name if item.service else None,
            )
            for item in invoice.invoice_items
        ],
    )


@router.post("/appointments/{appointment_id}", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice_for_appointment(
    appointment_id: uuid.UUID,
    payload: InvoiceCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceRead:
    appointment = await _get_appointment(session, current_user.id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")

    if appointment.invoice:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fatura ja existente para este agendamento")

    pet = appointment.pet
    client = pet.client if pet else None

    service_map: dict[uuid.UUID, Service] = {}
    service_ids = {item.service_id for item in payload.items if item.service_id}
    if service_ids:
        result = await session.execute(
            select(Service).where(Service.id.in_(service_ids), Service.user_id == current_user.id)
        )
        service_map = {svc.id: svc for svc in result.scalars()}
        missing = service_ids - set(service_map.keys())
        if missing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Servico invalido nos itens")

    invoice = Invoice(
        user_id=current_user.id,
        appointment_id=appointment.id,
        pet_id=pet.id if pet else None,
        client_id=client.id if client else None,
        discount_amount=payload.discount_amount,
        surcharge_amount=payload.surcharge_amount,
        final_amount=payload.final_amount,
        created_at=datetime.now(timezone.utc),
    )
    session.add(invoice)
    await session.flush()

    items = []
    for item in payload.items:
        svc = service_map.get(item.service_id) if item.service_id else None
        items.append(
            InvoiceItem(
                invoice_id=invoice.id,
                service_id=item.service_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
                service=svc,
            )
        )
    session.add_all(items)

    appointment.status = AppointmentStatus.completed
    await session.commit()
    await session.refresh(invoice)
    await session.refresh(appointment)
    return _serialize_invoice(invoice)


@router.get("/appointments/{appointment_id}", response_model=InvoiceRead)
async def get_invoice_by_appointment(
    appointment_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceRead:
    result = await session.execute(
        select(Invoice)
        .join(Appointment)
        .where(Invoice.appointment_id == appointment_id, Appointment.user_id == current_user.id)
        .options(selectinload(Invoice.invoice_items).selectinload(InvoiceItem.service))
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fatura nao encontrada")
    return _serialize_invoice(invoice)


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceRead:
    result = await session.execute(
        select(Invoice)
        .where(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
        .options(selectinload(Invoice.invoice_items).selectinload(InvoiceItem.service))
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fatura nao encontrada")
    return _serialize_invoice(invoice)
