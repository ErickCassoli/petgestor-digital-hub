from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.report import ReportRequest, ReportResponse
from app.services.reporting import generate_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportResponse)
async def build_report(
    payload: ReportRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    try:
        return await generate_report(session, current_user.id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao gerar relatorio") from exc
