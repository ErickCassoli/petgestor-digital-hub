from datetime import datetime
from uuid import UUID

from pydantic import EmailStr

from app.schemas.base import APIModel


class ProfileRead(APIModel):
    user_id: UUID
    name: str | None
    role: str
    trial_end_date: datetime | None
    is_subscribed: bool
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(APIModel):
    name: str | None = None
    role: str | None = None


class UserRead(APIModel):
    id: UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime
    profile: ProfileRead | None = None
