from datetime import date
from uuid import UUID

from app.schemas.base import APIModel


class DateValue(APIModel):
    date: str
    value: float


class DateCount(APIModel):
    date: str
    count: int


class NamedValue(APIModel):
    name: str
    value: float


class RankedItem(APIModel):
    id: UUID | None = None
    name: str
    quantity: float | None = None
    revenue: float | None = None
    visits: int | None = None
    spent: float | None = None


class ReportRequest(APIModel):
    report_type: str
    start_date: date
    end_date: date
    export_format: str | None = None


class ReportResponse(APIModel):
    totalRevenue: float | None = None
    servicesRevenue: float | None = None
    productsRevenue: float | None = None
    appointmentsRevenue: float | None = None
    salesCount: int | None = None
    servicesSalesCount: int | None = None
    productsSalesCount: int | None = None
    appointmentsCount: int | None = None
    salesChart: list[DateValue] | None = None
    appointmentsChart: list[DateCount] | None = None
    appointmentStatusData: list[NamedValue] | None = None
    topServices: list[RankedItem] | None = None
    topProducts: list[RankedItem] | None = None
    topClients: list[RankedItem] | None = None
    totalClients: int | None = None
    totalVisits: int | None = None
    totalSpent: float | None = None
    exportedFile: str | None = None
    fileName: str | None = None
    fileType: str | None = None
