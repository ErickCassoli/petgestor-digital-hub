from __future__ import annotations

import logging
from dataclasses import dataclass

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class MailContext:
    fm: FastMail | None


_mail_context: MailContext | None = None


def _build_context() -> MailContext:
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_port or not settings.smtp_from:
        logger.warning("SMTP settings missing, emails will not be sent")
        return MailContext(fm=None)

    config = ConnectionConfig(
        MAIL_USERNAME=settings.smtp_username or "",
        MAIL_PASSWORD=settings.smtp_password or "",
        MAIL_FROM=settings.smtp_from,
        MAIL_PORT=settings.smtp_port,
        MAIL_SERVER=settings.smtp_host,
        MAIL_FROM_NAME=settings.project_name,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=bool(settings.smtp_username),
    )
    return MailContext(fm=FastMail(config))


def _get_context() -> MailContext:
    global _mail_context
    if _mail_context is None:
        _mail_context = _build_context()
    return _mail_context


async def send_password_reset_email(email: str, reset_link: str) -> None:
    context = _get_context()
    if context.fm is None:
        logger.info("Password reset token for %s: %s", email, reset_link)
        return

    message = MessageSchema(
        subject="PetGestor - Reset de senha",
        recipients=[email],
        body=(
            "<p>Voce solicitou a redefinicao da sua senha no PetGestor.</p>"
            f"<p>Clique no link abaixo para continuar:</p>"
            f"<p><a href='{reset_link}'>{reset_link}</a></p>"
            "<p>Se voce nao solicitou essa alteracao, ignore este e-mail.</p>"
        ),
        subtype="html",
    )
    await context.fm.send_message(message)
