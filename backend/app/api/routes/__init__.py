from fastapi import APIRouter

from app.api.routes import (
    appointments,
    auth,
    clients,
    dashboard,
    health,
    invoices,
    pets,
    products,
    profiles,
    reports,
    sales,
    services,
    subscription,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(profiles.router)
api_router.include_router(clients.router)
api_router.include_router(pets.router)
api_router.include_router(services.router)
api_router.include_router(products.router)
api_router.include_router(appointments.router)
api_router.include_router(invoices.router)
api_router.include_router(sales.router)
api_router.include_router(reports.router)
api_router.include_router(subscription.router)
api_router.include_router(dashboard.router)
