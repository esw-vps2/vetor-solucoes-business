"""Testes de autenticação por API Key e healthcheck."""
import pytest
from httpx import AsyncClient, ASGITransport


async def test_health_sem_chave_retorna_200(app_with_key):
    """GET /health deve responder 200 mesmo sem API Key."""
    transport = ASGITransport(app=app_with_key)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "API_KEY" not in body
    assert "PB_CLIENT_SECRET" not in body


async def test_endpoint_sem_chave_retorna_401(app_with_key):
    """Endpoint operacional sem X-API-Key deve retornar 401."""
    transport = ASGITransport(app=app_with_key)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/token_application")

    assert response.status_code == 401
    assert "ausente" in response.json()["detail"].lower() or "inválida" in response.json()["detail"].lower()


async def test_endpoint_chave_incorreta_retorna_401(app_with_key):
    """Endpoint operacional com chave errada deve retornar 401."""
    transport = ASGITransport(app=app_with_key)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/token_application",
            headers={"X-API-Key": "chave-totalmente-errada"}
        )

    assert response.status_code == 401


async def test_endpoint_chave_valida_passa_middleware(app_with_key, valid_api_key):
    """Endpoint operacional com chave válida deve passar pelo middleware.
    Pode retornar 500 (Redis/Azure fictício), mas NÃO 401."""
    transport = ASGITransport(app=app_with_key, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/token_application",
            headers={"X-API-Key": valid_api_key}
        )

    assert response.status_code != 401


async def test_generate_token_sem_chave_retorna_401(app_with_key):
    """POST /reports/GenerateToken sem chave deve retornar 401."""
    transport = ASGITransport(app=app_with_key)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/reports/GenerateToken",
            json={
                "dataset_ids": ["ds-1"],
                "report_ids": ["rpt-1"]
            }
        )

    assert response.status_code == 401


async def test_groups_sem_chave_retorna_401(app_with_key):
    """GET /groups sem chave deve retornar 401."""
    transport = ASGITransport(app=app_with_key)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/groups")

    assert response.status_code == 401


async def test_reports_sem_chave_retorna_401(app_with_key):
    """GET /groups/{id}/reports sem chave deve retornar 401."""
    transport = ASGITransport(app=app_with_key)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/groups/fake-id/reports")

    assert response.status_code == 401


async def test_test_env_sem_key_health_funciona(app_without_key):
    """Em ENVIRONMENT=test sem API_KEY, /health continua público."""
    transport = ASGITransport(app=app_without_key)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
