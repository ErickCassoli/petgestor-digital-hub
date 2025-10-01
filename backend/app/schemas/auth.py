from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import APIModel


class Token(APIModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(APIModel):
    sub: UUID
    exp: datetime
    type: str


class AuthResponse(APIModel):
    user_id: UUID
    email: EmailStr
    access_token: str
    refresh_token: str


class LoginRequest(APIModel):
    email: EmailStr
    password: str


class RegisterRequest(APIModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str | None = None
    role: str | None = None

    @field_validator("role")
    @classmethod
    def _validate_role(cls, value: str | None) -> str | None:
        if value is None:
            return None
        allowed = {"admin", "atendente"}
        if value not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return value


class RefreshRequest(APIModel):
    refresh_token: str


class ChangePasswordRequest(APIModel):
    current_password: str
    new_password: str = Field(min_length=8)


class PasswordResetRequest(APIModel):
    email: EmailStr


class PasswordResetConfirm(APIModel):
    token: str
    new_password: str = Field(min_length=8)
