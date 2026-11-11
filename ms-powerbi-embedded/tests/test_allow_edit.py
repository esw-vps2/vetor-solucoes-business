"""Testes garantindo que o payload enviado ao Power BI usa allowEdit: false."""
from unittest.mock import patch, MagicMock
from src.powerbi.embedded.embedded import Embedded


def test_payload_generate_token_usa_allow_edit_false():
    """O payload enviado para a API do Power BI deve conter allowEdit: False
    em todos os relatórios. Isso garante que o usuário final da Medical Bills
    não pode editar, criar ou salvar relatórios no Power BI."""
    captured_payload = {}

    def mock_post(self_api):
        """Captura o JSON enviado para a API do Power BI."""
        captured_payload.update(self_api.json)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tokenId": "test-token-id",
            "token": "eyJ0eXAiOiJKV1QiLCJh...",
            "expiration": "2099-12-31T23:59:59Z"
        }
        mock_response.raise_for_status = MagicMock()
        return mock_response

    with patch.object(Embedded, '__init__', lambda self, **kwargs: None), \
         patch('src.powerbi.embedded.embedded.redis_client') as mock_redis, \
         patch('src.powerbi.embedded.embedded.Api') as MockApi:

        mock_redis.get.return_value = None
        mock_redis.setex = MagicMock()

        mock_api_instance = MagicMock()
        mock_api_instance.post = lambda: mock_post(MockApi.call_args)
        MockApi.return_value = mock_api_instance

        # Precisamos definir os atributos que __init__ normalmente setaria
        embedded = Embedded.__new__(Embedded)
        embedded.base_url = "https://api.powerbi.com/v1.0"
        embedded.access_token = "Bearer fake-token"
        embedded.headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer fake-token",
        }

        # Captura o payload real passado para Api()
        def capture_api_call(**kwargs):
            captured_payload.update(kwargs.get("json", {}))
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "tokenId": "test-token-id",
                "token": "eyJ0eXAiOiJKV1QiLCJh...",
                "expiration": "2099-12-31T23:59:59Z"
            }
            mock_response.raise_for_status = MagicMock()
            mock_instance = MagicMock()
            mock_instance.post.return_value = mock_response
            return mock_instance

        MockApi.side_effect = lambda **kwargs: capture_api_call(**kwargs)

        result = embedded.get_embedded_token(
            dataset_ids=["dataset-001", "dataset-002"],
            report_ids=["report-001", "report-002"]
        )

    # Verifica que o payload foi capturado
    assert "reports" in captured_payload, "Payload não contém campo 'reports'"

    # Verifica que TODOS os relatórios têm allowEdit: False
    for report in captured_payload["reports"]:
        assert report["allowEdit"] is False, (
            f"Relatório {report['id']} tem allowEdit={report['allowEdit']}. "
            f"Deve ser False para impedir edição pelo usuário final."
        )


def test_payload_sem_rls_nao_inclui_identities():
    """Sem username, o payload NÃO deve incluir o campo 'identities'."""
    captured_payload = {}

    with patch.object(Embedded, '__init__', lambda self, **kwargs: None), \
         patch('src.powerbi.embedded.embedded.redis_client') as mock_redis, \
         patch('src.powerbi.embedded.embedded.Api') as MockApi:

        mock_redis.get.return_value = None
        mock_redis.setex = MagicMock()

        def capture_api_call(**kwargs):
            captured_payload.update(kwargs.get("json", {}))
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "tokenId": "test-id",
                "token": "test-token",
                "expiration": "2099-12-31T23:59:59Z"
            }
            mock_response.raise_for_status = MagicMock()
            mock_instance = MagicMock()
            mock_instance.post.return_value = mock_response
            return mock_instance

        MockApi.side_effect = lambda **kwargs: capture_api_call(**kwargs)

        embedded = Embedded.__new__(Embedded)
        embedded.base_url = "https://api.powerbi.com/v1.0"
        embedded.access_token = "Bearer fake"
        embedded.headers = {"Authorization": "Bearer fake"}

        embedded.get_embedded_token(
            dataset_ids=["ds-1"],
            report_ids=["rpt-1"],
            username=None,
            roles=None
        )

    assert "identities" not in captured_payload, (
        "Payload inclui 'identities' sem username — RLS não deveria estar ativo."
    )


def test_payload_com_rls_inclui_identities():
    """Com username e roles, o payload DEVE incluir 'identities' com os dados corretos."""
    captured_payload = {}

    with patch.object(Embedded, '__init__', lambda self, **kwargs: None), \
         patch('src.powerbi.embedded.embedded.redis_client') as mock_redis, \
         patch('src.powerbi.embedded.embedded.Api') as MockApi:

        mock_redis.get.return_value = None
        mock_redis.setex = MagicMock()

        def capture_api_call(**kwargs):
            captured_payload.update(kwargs.get("json", {}))
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "tokenId": "test-id",
                "token": "test-token",
                "expiration": "2099-12-31T23:59:59Z"
            }
            mock_response.raise_for_status = MagicMock()
            mock_instance = MagicMock()
            mock_instance.post.return_value = mock_response
            return mock_instance

        MockApi.side_effect = lambda **kwargs: capture_api_call(**kwargs)

        embedded = Embedded.__new__(Embedded)
        embedded.base_url = "https://api.powerbi.com/v1.0"
        embedded.access_token = "Bearer fake"
        embedded.headers = {"Authorization": "Bearer fake"}

        embedded.get_embedded_token(
            dataset_ids=["ds-1"],
            report_ids=["rpt-1"],
            username="admin@hospital.com",
            roles=["Gerente"]
        )

    assert "identities" in captured_payload
    identity = captured_payload["identities"][0]
    assert identity["username"] == "admin@hospital.com"
    assert identity["roles"] == ["Gerente"]
    assert identity["datasets"] == ["ds-1"]
