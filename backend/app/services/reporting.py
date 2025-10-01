from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import date
from decimal import Decimal
from typing import Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Appointment,
    AppointmentStatus,
    Pet,
    Sale,
    SaleItem,
    SaleItemType,
    SaleType,
)
from app.schemas.report import ReportRequest, ReportResponse


def _to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


async def generate_report(session: AsyncSession, user_id, payload: ReportRequest) -> ReportResponse:
    report_type = payload.report_type
    if report_type == "revenue":
        return await _revenue_report(session, user_id, payload.start_date, payload.end_date)
    if report_type == "services":
        return await _services_report(session, user_id, payload.start_date, payload.end_date)
    if report_type == "products":
        return await _products_report(session, user_id, payload.start_date, payload.end_date)
    if report_type == "clients":
        return await _clients_report(session, user_id, payload.start_date, payload.end_date)
    if report_type == "appointments":
        return await _appointments_report(session, user_id, payload.start_date, payload.end_date)
    raise ValueError("Tipo de relatorio inválido")


async def _load_sales(session: AsyncSession, user_id, start: date, end: date) -> list[Sale]:
    stmt = (
        select(Sale)
        .where(Sale.user_id == user_id, Sale.sale_date >= start, Sale.sale_date <= end)
        .options(selectinload(Sale.items), selectinload(Sale.client))
        .order_by(Sale.sale_date.asc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


async def _load_completed_appointments(session: AsyncSession, user_id, start: date, end: date) -> list[Appointment]:
    stmt = (
        select(Appointment)
        .where(
            Appointment.user_id == user_id,
            Appointment.status == AppointmentStatus.completed,
            Appointment.date >= start,
            Appointment.date <= end,
        )
        .options(selectinload(Appointment.service))
    )
    result = await session.execute(stmt)
    return result.scalars().all()


async def _revenue_report(session: AsyncSession, user_id, start: date, end: date) -> ReportResponse:
    sales = await _load_sales(session, user_id, start, end)
    appointments = await _load_completed_appointments(session, user_id, start, end)

    appointments_revenue = sum(_to_float(appt.service.price) for appt in appointments if appt.service)
    appointments_count = len(appointments)

    if not sales:
        return ReportResponse(
            totalRevenue=appointments_revenue,
            servicesRevenue=0,
            productsRevenue=0,
            appointmentsRevenue=appointments_revenue,
            salesCount=0,
            servicesSalesCount=0,
            productsSalesCount=0,
            appointmentsCount=appointments_count,
            salesChart=[
                {"date": appt.date.isoformat(), "value": _to_float(appt.service.price) if appt.service else 0}
                for appt in appointments
            ],
        )

    total_revenue = sum(_to_float(sale.total) for sale in sales) + appointments_revenue

    services_revenue = 0.0
    products_revenue = 0.0
    services_sales_count = 0
    products_sales_count = 0

    if any(sale.items for sale in sales):
        for sale in sales:
            for item in sale.items:
                if item.type == SaleItemType.service:
                    services_revenue += _to_float(item.total)
                    services_sales_count += 1
                elif item.type == SaleItemType.product:
                    products_revenue += _to_float(item.total)
                    products_sales_count += 1
    else:
        services_sales = [sale for sale in sales if sale.type == SaleType.service]
        products_sales = [sale for sale in sales if sale.type == SaleType.product]
        mixed_sales = [sale for sale in sales if sale.type == SaleType.mixed]
        services_revenue = sum(_to_float(sale.total) for sale in services_sales)
        products_revenue = sum(_to_float(sale.total) for sale in products_sales)
        mixed_total = sum(_to_float(sale.total) for sale in mixed_sales)
        services_revenue += mixed_total / 2
        products_revenue += mixed_total / 2

    sales_by_date: Dict[str, float] = defaultdict(float)
    for sale in sales:
        if sale.sale_date:
            sales_by_date[sale.sale_date.date().isoformat()] += _to_float(sale.total)
    for appt in appointments:
        if appt.date and appt.service:
            sales_by_date[appt.date.isoformat()] += _to_float(appt.service.price)

    sales_chart = [{"date": day, "value": value} for day, value in sorted(sales_by_date.items())]

    return ReportResponse(
        totalRevenue=total_revenue,
        servicesRevenue=services_revenue,
        productsRevenue=products_revenue,
        appointmentsRevenue=appointments_revenue,
        salesCount=len(sales),
        servicesSalesCount=services_sales_count,
        productsSalesCount=products_sales_count,
        appointmentsCount=appointments_count,
        salesChart=sales_chart,
    )


async def _services_report(session: AsyncSession, user_id, start: date, end: date) -> ReportResponse:
    stmt = (
        select(SaleItem)
        .join(Sale)
        .where(
            Sale.user_id == user_id,
            Sale.sale_date >= start,
            Sale.sale_date <= end,
            SaleItem.type == SaleItemType.service,
        )
        .options(selectinload(SaleItem.service))
    )
    result = await session.execute(stmt)
    sale_items = result.scalars().all()

    appointments = await _load_completed_appointments(session, user_id, start, end)

    services_data: Dict[uuid.UUID, Dict[str, float]] = {}

    for item in sale_items:
        if not item.service_id or not item.service:
            continue
        svc = services_data.setdefault(
            item.service_id,
            {"id": str(item.service_id), "name": item.service.name, "quantity": 0.0, "revenue": 0.0},
        )
        svc["quantity"] += _to_float(item.quantity)
        svc["revenue"] += _to_float(item.price) * _to_float(item.quantity)

    for appt in appointments:
        if not appt.service_id or not appt.service:
            continue
        svc = services_data.setdefault(
            appt.service_id,
            {"id": str(appt.service_id), "name": appt.service.name, "quantity": 0.0, "revenue": 0.0},
        )
        svc["quantity"] += 1
        svc["revenue"] += _to_float(appt.service.price)

    top_services = sorted(services_data.values(), key=lambda item: item["revenue"], reverse=True)[:10]
    total_revenue = sum(item["revenue"] for item in top_services)
    total_items = sum(item["quantity"] for item in top_services)

    return ReportResponse(
        topServices=top_services,
        totalRevenue=total_revenue,
        totalItems=total_items,
        servicesRevenue=total_revenue,
        servicesSalesCount=int(total_items),
    )


async def _products_report(session: AsyncSession, user_id, start: date, end: date) -> ReportResponse:
    stmt = (
        select(SaleItem)
        .join(Sale)
        .where(
            Sale.user_id == user_id,
            Sale.sale_date >= start,
            Sale.sale_date <= end,
            SaleItem.type == SaleItemType.product,
        )
        .options(selectinload(SaleItem.product))
    )
    result = await session.execute(stmt)
    sale_items = result.scalars().all()

    products_data: Dict[uuid.UUID, Dict[str, float]] = {}
    for item in sale_items:
        if not item.product_id or not item.product:
            continue
        prod = products_data.setdefault(
            item.product_id,
            {"id": str(item.product_id), "name": item.product.name, "quantity": 0.0, "revenue": 0.0},
        )
        prod["quantity"] += _to_float(item.quantity)
        prod["revenue"] += _to_float(item.price) * _to_float(item.quantity)

    top_products = sorted(products_data.values(), key=lambda item: item["revenue"], reverse=True)[:10]
    total_revenue = sum(item["revenue"] for item in top_products)
    total_items = sum(item["quantity"] for item in top_products)

    return ReportResponse(
        topProducts=top_products,
        totalRevenue=total_revenue,
        totalItems=total_items,
        productsRevenue=total_revenue,
        productsSalesCount=int(total_items),
    )


async def _clients_report(session: AsyncSession, user_id, start: date, end: date) -> ReportResponse:
    sales_stmt = (
        select(Sale)
        .where(
            Sale.user_id == user_id,
            Sale.sale_date >= start,
            Sale.sale_date <= end,
            Sale.client_id.is_not(None),
        )
        .options(selectinload(Sale.client))
    )
    sales_result = await session.execute(sales_stmt)
    sales = sales_result.scalars().all()

    appt_stmt = (
        select(Appointment)
        .where(Appointment.user_id == user_id, Appointment.date >= start, Appointment.date <= end)
        .options(selectinload(Appointment.pet).selectinload(Pet.client), selectinload(Appointment.service))
    )
    appt_result = await session.execute(appt_stmt)
    appointments = appt_result.scalars().all()

    clients_data: Dict[uuid.UUID, Dict[str, float]] = {}

    for sale in sales:
        if not sale.client_id or not sale.client:
            continue
        entry = clients_data.setdefault(
            sale.client_id,
            {"id": str(sale.client_id), "name": sale.client.name, "visits": 0.0, "spent": 0.0},
        )
        entry["visits"] += 1
        entry["spent"] += _to_float(sale.total)

    for appt in appointments:
        client = appt.pet.client if appt.pet else None
        if not client:
            continue
        entry = clients_data.setdefault(
            client.id,
            {"id": str(client.id), "name": client.name, "visits": 0.0, "spent": 0.0},
        )
        entry["visits"] += 1
        if appt.status == AppointmentStatus.completed and appt.service:
            entry["spent"] += _to_float(appt.service.price)

    top_clients = sorted(clients_data.values(), key=lambda item: item["spent"], reverse=True)[:10]
    total_clients = len(clients_data)
    total_visits = sum(item["visits"] for item in clients_data.values())
    total_spent = sum(item["spent"] for item in clients_data.values())

    return ReportResponse(
        topClients=top_clients,
        totalClients=total_clients,
        totalVisits=int(total_visits),
        totalRevenue=total_spent,
    )


async def _appointments_report(session: AsyncSession, user_id, start: date, end: date) -> ReportResponse:
    stmt = (
        select(Appointment)
        .where(Appointment.user_id == user_id, Appointment.date >= start, Appointment.date <= end)
        .options(selectinload(Appointment.service))
    )
    result = await session.execute(stmt)
    appointments = result.scalars().all()
    if not appointments:
        return ReportResponse(appointmentsCount=0, appointmentsRevenue=0, appointmentsChart=[])

    revenue = sum(
        _to_float(appt.service.price)
        for appt in appointments
        if appt.status == AppointmentStatus.completed and appt.service
    )

    by_date: Dict[str, int] = defaultdict(int)
    status_counts: Dict[str, int] = defaultdict(int)
    for appt in appointments:
        if appt.date:
            by_date[appt.date.isoformat()] += 1
        status_counts[appt.status.value] += 1

    status_labels = {
        "pending": "Pendente",
        "confirmed": "Confirmado",
        "completed": "Concluido",
        "cancelled": "Cancelado",
        "no_show": "Nao Compareceu",
    }

    chart = [{"date": d, "count": count} for d, count in sorted(by_date.items())]
    status_data = [
        {"name": status_labels.get(key, key), "value": value}
        for key, value in status_counts.items()
    ]

    return ReportResponse(
        appointmentsCount=len(appointments),
        appointmentsRevenue=revenue,
        appointmentsChart=chart,
        appointmentStatusData=status_data,
    )
