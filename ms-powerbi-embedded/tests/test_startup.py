"""Testes de inicialização do servidor e obrigatoriedade da API Key."""
import os
import importlib
import pytest


def _reload_app():
    import src.app.server as server_mod
    importlib.reload(server_mod)
    return server_mod


def test_test_sem_api_key_inicia():
    """ENVIRONMENT=test pode iniciar sem API_KEY."""
    os.environ["ENVIRONMENT"] = "test"
    os.environ["API_KEY"] = ""
    mod = _reload_app()
    assert mod.app is not None


def test_development_sem_api_key_falha():
    """ENVIRONMENT=development sem API_KEY deve falhar no startup."""
    os.environ["ENVIRONMENT"] = "development"
    os.environ["API_KEY"] = ""
    with pytest.raises(RuntimeError, match="API_KEY é obrigatória"):
        _reload_app()
    os.environ["ENVIRONMENT"] = "test"


def test_production_sem_api_key_falha():
    """ENVIRONMENT=production sem API_KEY deve falhar no startup."""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["API_KEY"] = ""
    with pytest.raises(RuntimeError, match="API_KEY é obrigatória"):
        _reload_app()
    os.environ["ENVIRONMENT"] = "test"


def test_ambiente_desconhecido_sem_api_key_falha():
    """Ambiente desconhecido sem API_KEY deve falhar (fail-safe)."""
    os.environ["ENVIRONMENT"] = "staging"
    os.environ["API_KEY"] = ""
    with pytest.raises(RuntimeError, match="API_KEY é obrigatória"):
        _reload_app()
    os.environ["ENVIRONMENT"] = "test"


def test_ambiente_ausente_sem_api_key_falha():
    """Sem ENVIRONMENT definido, assume production e falha sem API_KEY."""
    os.environ.pop("ENVIRONMENT", None)
    os.environ["API_KEY"] = ""
    with pytest.raises(RuntimeError, match="API_KEY é obrigatória"):
        _reload_app()
    os.environ["ENVIRONMENT"] = "test"


def test_development_com_api_key_inicia():
    """ENVIRONMENT=development com API_KEY deve iniciar normalmente."""
    os.environ["ENVIRONMENT"] = "development"
    os.environ["API_KEY"] = "dev-key-123"
    mod = _reload_app()
    assert mod.app is not None
    os.environ["ENVIRONMENT"] = "test"
    os.environ["API_KEY"] = ""


def test_production_com_api_key_inicia():
    """ENVIRONMENT=production com API_KEY deve iniciar normalmente."""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["API_KEY"] = "prod-key-456"
    mod = _reload_app()
    assert mod.app is not None
    os.environ["ENVIRONMENT"] = "test"
    os.environ["API_KEY"] = ""
