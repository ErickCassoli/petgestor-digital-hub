from datetime import date
from uuid import UUID

from app.schemas.base import APIModel


class DashboardMetrics(APIModel):
    clientCount: int
    appointmentsToday: int
    productCount: int
    monthlySales: float


class AppointmentPreview(APIModel):
    pet_name: str
    client_name: str
    service_name: str
    date: date
    time: str


class LowStockProduct(APIModel):
    id: UUID
    name: str
    stock: float
    min_stock: float | None = None


class DashboardResponse(APIModel):
    metrics: DashboardMetrics
    appointments: list[AppointmentPreview]
    lowStockProducts: list[LowStockProduct]
