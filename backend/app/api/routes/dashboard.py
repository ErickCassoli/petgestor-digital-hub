from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Appointment, AppointmentStatus, Client, Pet, Product, Sale, Service, User
from app.schemas.dashboard import AppointmentPreview, DashboardMetrics, DashboardResponse, LowStockProduct

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardResponse)
async def get_overview(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardResponse:
    today = date.today()
    first_day = today.replace(day=1)

    client_count = await session.scalar(
        select(func.count()).select_from(Client).where(Client.user_id == current_user.id)
    )
    appointment_today = await session.scalar(
        select(func.count())
        .select_from(Appointment)
        .where(Appointment.user_id == current_user.id, Appointment.date == today)
    )
    product_count = await session.scalar(
        select(func.count()).select_from(Product).where(Product.user_id == current_user.id)
    )
    monthly_sales = await session.scalar(
        select(func.coalesce(func.sum(Sale.total), 0))
        .where(Sale.user_id == current_user.id, Sale.sale_date >= first_day)
    )

    upcoming_stmt = (
        select(Appointment)
        .where(
            Appointment.user_id == current_user.id,
            Appointment.status == AppointmentStatus.confirmed,
            Appointment.date >= today,
        )
        .order_by(Appointment.date.asc(), Appointment.time.asc())
        .limit(4)
        .options(
            selectinload(Appointment.pet).selectinload(Pet.client),
            selectinload(Appointment.service),
        )
    )
    upcoming_result = await session.execute(upcoming_stmt)
    upcoming = upcoming_result.scalars().all()

    appointments_preview: list[AppointmentPreview] = []
    for appt in upcoming:
        pet = appt.pet
        client = pet.client if pet else None
        service = appt.service
        appointments_preview.append(
            AppointmentPreview(
                pet_name=pet.name if pet else "",
                client_name=client.name if client else "",
                service_name=service.name if service else "",
                date=appt.date,
                time=appt.time.strftime("%H:%M") if appt.time else "",
            )
        )

    low_stock_stmt = (
        select(Product)
        .where(Product.user_id == current_user.id)
        .order_by(Product.stock.asc())
        .limit(10)
    )
    low_stock_result = await session.execute(low_stock_stmt)
    low_stock_products = [
        LowStockProduct(
            id=prod.id,
            name=prod.name,
            stock=float(prod.stock),
            min_stock=float(prod.min_stock) if prod.min_stock is not None else None,
        )
        for prod in low_stock_result.scalars().all()
        if prod.stock <= 0 or (prod.min_stock is not None and prod.stock <= prod.min_stock)
    ]

    metrics = DashboardMetrics(
        clientCount=int(client_count or 0),
        appointmentsToday=int(appointment_today or 0),
        productCount=int(product_count or 0),
        monthlySales=float(monthly_sales or 0),
    )
    return DashboardResponse(metrics=metrics, appointments=appointments_preview, lowStockProducts=low_stock_products)
