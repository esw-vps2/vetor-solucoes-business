import os
import secrets
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src import __version__
from src.config import Settings

logger = logging.getLogger(__name__)


class ApiKeyMiddleware(BaseHTTPMiddleware):
    """Middleware de autenticação por API Key.
    Valida o header X-API-Key em todas as requisições,
    exceto no endpoint /health."""

    EXEMPT_PATHS = {"/health"}

    def __init__(self, app, api_key: str):
        super().__init__(app)
        self.api_key = api_key

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        provided_key = request.headers.get("X-API-Key", "")
        if not provided_key or not secrets.compare_digest(provided_key, self.api_key):
            return JSONResponse(
                status_code=401,
                content={"detail": "API Key ausente ou inválida"},
            )

        return await call_next(request)


def init_routes(app_: FastAPI) -> None:
    from src.api.routes import routes
    app_.include_router(routes)


def create_app() -> FastAPI:
    config = Settings()

    # API_KEY é obrigatória em todos os ambientes exceto "test".
    # Ambientes desconhecidos são tratados como produção (fail-safe).
    environment = os.getenv("ENVIRONMENT", "production")
    is_test = environment == "test"

    if not config.API_KEY and not is_test:
        raise RuntimeError(
            f"API_KEY é obrigatória (ENVIRONMENT={environment}). "
            "Defina a variável de ambiente API_KEY antes de iniciar."
        )

    app_ = FastAPI(
        title="PowerBI Embedded Backend",
        description="PowerBI Embedded Backend API",
        version=__version__,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Middleware sempre ativo quando API_KEY está definida.
    # Em test sem API_KEY, o middleware não é adicionado.
    if config.API_KEY:
        app_.add_middleware(ApiKeyMiddleware, api_key=config.API_KEY)

    init_routes(app_=app_)

    return app_

app = create_app()
