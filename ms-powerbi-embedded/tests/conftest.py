import os
import pytest

# Garante que os testes rodem com ENVIRONMENT=test (sem exigir API_KEY)
os.environ.setdefault("ENVIRONMENT", "test")

# Variáveis obrigatórias do Power BI — valores fictícios para testes
os.environ.setdefault("PB_CLIENT_ID", "00000000-0000-0000-0000-000000000000")
os.environ.setdefault("PB_CLIENT_SECRET", "test-secret")
os.environ.setdefault("PB_TENANT_ID", "00000000-0000-0000-0000-000000000000")
os.environ.setdefault("PB_SERVICE_PRINCIPAL", "00000000-0000-0000-0000-000000000000")
os.environ.setdefault("PB_BASE_URL", "https://api.powerbi.com/v1.0")
os.environ.setdefault("PB_AUTHORITY_URL", "https://login.microsoftonline.com/")
os.environ.setdefault("PB_USERNAME", "test@example.com")
os.environ.setdefault("PB_PASSWORD", "test-password")
os.environ.setdefault("REDIS_HOST", "localhost")
os.environ.setdefault("REDIS_PORT", "6379")


@pytest.fixture
def valid_api_key():
    return "test-api-key-segura-12345"


@pytest.fixture
def app_without_key():
    """Cria app FastAPI SEM API_KEY configurada (ambiente de teste)."""
    os.environ["API_KEY"] = ""
    # Reimporta para recriar o app com a nova config
    import importlib
    import src.app.server as server_mod
    importlib.reload(server_mod)
    return server_mod.app


@pytest.fixture
def app_with_key(valid_api_key):
    """Cria app FastAPI COM API_KEY configurada."""
    os.environ["API_KEY"] = valid_api_key
    import importlib
    import src.app.server as server_mod
    importlib.reload(server_mod)
    return server_mod.app
