from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    project_name: str = Field(default="PetGestor API")
    api_v1_prefix: str = Field(default="/api/v1")
    frontend_url: AnyHttpUrl | None = Field(default=None, alias="FRONTEND_URL")

    # Security
    secret_key: str = Field(default="changeme", env="SECRET_KEY")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60 * 4)
    refresh_token_expire_minutes: int = Field(default=60 * 24 * 7)

    # Database
    database_url: str = Field(default="sqlite+aiosqlite:///./petgestor.db", alias="DATABASE_URL")

    # CORS
    backend_cors_origins: List[AnyHttpUrl] | str = Field(default_factory=list, alias="BACKEND_CORS_ORIGINS")

    # Stripe
    stripe_secret_key: str | None = Field(default=None, alias="STRIPE_SECRET_KEY")
    stripe_price_monthly: str | None = Field(default=None, alias="STRIPE_PRICE_MONTHLY")
    stripe_price_trimestral: str | None = Field(default=None, alias="STRIPE_PRICE_TRIMESTRAL")
    stripe_price_semestral: str | None = Field(default=None, alias="STRIPE_PRICE_SEMESTRAL")

    # Mail
    smtp_host: str | None = Field(default=None, alias="SMTP_HOST")
    smtp_port: int | None = Field(default=None, alias="SMTP_PORT")
    smtp_username: str | None = Field(default=None, alias="SMTP_USERNAME")
    smtp_password: str | None = Field(default=None, alias="SMTP_PASSWORD")
    smtp_from: str | None = Field(default=None, alias="SMTP_FROM")

    trial_days: int = Field(default=7, alias="TRIAL_DAYS")


@lru_cache
def get_settings() -> Settings:
    return Settings()
