# Import models for Alembic autogeneration
from app.db.base_class import Base  # noqa: F401
from app.models import (  # noqa: F401
    Appointment,
    AppointmentStatus,
    Client,
    Invoice,
    InvoiceItem,
    PasswordResetToken,
    Pet,
    Product,
    Profile,
    Sale,
    SaleItem,
    SaleItemType,
    SaleType,
    Service,
    User,
    UserRole,
)
