from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models import PasswordResetToken, Profile, User, UserRole
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
)
from app.schemas.user import ProfileRead, ProfileUpdate, UserRead
from app.services.mailer import send_password_reset_email
from app.utils.tokens import generate_reset_token, hash_token

router = APIRouter(prefix="/auth", tags=["auth"])


async def _get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


def _build_user_read(user: User) -> UserRead:
    profile = None
    if user.profile:
        profile = ProfileRead(
            user_id=user.id,
            name=user.profile.name,
            role=user.profile.role.value,
            trial_end_date=user.profile.trial_end_date,
            is_subscribed=user.profile.is_subscribed,
            created_at=user.profile.created_at,
            updated_at=user.profile.updated_at,
        )
    return UserRead(
        id=user.id,
        email=user.email,
        created_at=user.created_at,
        updated_at=user.updated_at,
        profile=profile,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> UserRead:
    settings = get_settings()
    email = payload.email.lower()
    if await _get_user_by_email(session, email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail ja cadastrado")

    user = User(email=email, hashed_password=get_password_hash(payload.password))
    role = UserRole(payload.role) if payload.role else UserRole.admin
    trial_end = datetime.now(timezone.utc) + timedelta(days=settings.trial_days)
    profile = Profile(name=payload.name, role=role, trial_end_date=trial_end, is_subscribed=False)
    user.profile = profile
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nao foi possivel criar o usuario") from exc
    await session.refresh(user)
    return _build_user_read(user)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db)) -> AuthResponse:
    user = await _get_user_by_email(session, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais invalidas")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    return AuthResponse(user_id=user.id, email=user.email, access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=AuthResponse)
async def refresh_tokens(payload: RefreshRequest, session: AsyncSession = Depends(get_db)) -> AuthResponse:
    try:
        token_data = verify_refresh_token(payload.refresh_token)
    except HTTPException:
        raise
    user = await session.get(User, token_data)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario nao encontrado")
    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    return AuthResponse(user_id=user.id, email=user.email, access_token=access, refresh_token=refresh)


def verify_refresh_token(token: str) -> uuid.UUID:
    from app.core.security import decode_token

    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido") from exc
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    try:
        return uuid.UUID(str(sub))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido") from exc


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return _build_user_read(current_user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta")

    new_hash = get_password_hash(payload.new_password)
    await session.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(hashed_password=new_hash, updated_at=datetime.now(timezone.utc))
    )
    await session.commit()


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    payload: PasswordResetRequest,
    session: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    settings = get_settings()
    user = await _get_user_by_email(session, payload.email)
    if not user:
        return {"message": "Se existir uma conta para este e-mail, enviaremos instrucoes."}

    await session.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used.is_(False))
        .values(used=True)
    )

    raw_token = generate_reset_token()
    token_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    reset_record = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    session.add(reset_record)
    await session.commit()

    base_url = settings.frontend_url or "http://localhost:5173"
    reset_link = f"{base_url.rstrip('/')}/UpdatePassword?token={raw_token}"
    await send_password_reset_email(user.email, reset_link)
    return {"message": "Caso exista uma conta, enviamos as instrucoes para o e-mail informado."}


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_password_reset(
    payload: PasswordResetConfirm,
    session: AsyncSession = Depends(get_db),
) -> None:
    token_hash = hash_token(payload.token)
    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > now,
        )
        .order_by(PasswordResetToken.created_at.desc())
    )
    token_record = result.scalar_one_or_none()
    if not token_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token invalido ou expirado")

    user = await session.get(User, token_record.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario nao encontrado")

    user.hashed_password = get_password_hash(payload.new_password)
    user.updated_at = now
    token_record.used = True
    await session.commit()
