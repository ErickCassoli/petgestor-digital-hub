from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Profile, User
from app.schemas.user import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileRead)
async def get_profile_me(current_user: User = Depends(get_current_user)) -> ProfileRead:
    if not current_user.profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil nao encontrado")
    profile = current_user.profile
    return ProfileRead(
        user_id=current_user.id,
        name=profile.name,
        role=profile.role.value,
        trial_end_date=profile.trial_end_date,
        is_subscribed=profile.is_subscribed,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.patch("/me", response_model=ProfileRead)
async def update_profile_me(
    payload: ProfileUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileRead:
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil nao encontrado")

    values = {}
    if payload.name is not None:
        values[Profile.name] = payload.name
    if payload.role is not None:
        try:
            from app.models import UserRole

            values[Profile.role] = UserRole(payload.role)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cargo invalido") from exc
    if values:
        values[Profile.updated_at] = datetime.now(timezone.utc)
        await session.execute(update(Profile).where(Profile.user_id == current_user.id).values(values))
        await session.commit()
        await session.refresh(profile)

    return ProfileRead(
        user_id=current_user.id,
        name=profile.name,
        role=profile.role.value,
        trial_end_date=profile.trial_end_date,
        is_subscribed=profile.is_subscribed,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
