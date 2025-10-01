from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_token(subject: str | Any, expires_delta: timedelta, token_type: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    to_encode: Dict[str, Any] = {"sub": str(subject), "iat": now, "type": token_type}
    to_encode["exp"] = now + expires_delta
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(subject: str | Any) -> str:
    settings = get_settings()
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    return create_token(subject, expires_delta, token_type="access")


def create_refresh_token(subject: str | Any) -> str:
    settings = get_settings()
    expires_delta = timedelta(minutes=settings.refresh_token_expire_minutes)
    return create_token(subject, expires_delta, token_type="refresh")


def decode_token(token: str) -> Dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:  # pragma: no cover - security critical path
        raise ValueError("Invalid token") from exc


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
