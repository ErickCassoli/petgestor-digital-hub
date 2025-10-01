from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine


def create_application() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.project_name)

    origins = settings.backend_cors_origins
    if isinstance(origins, str):
        origins = [origin.strip() for origin in origins.split(",") if origin.strip()]

    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.on_event("startup")
    async def on_startup() -> None:  # pragma: no cover
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    return app


app = create_application()
