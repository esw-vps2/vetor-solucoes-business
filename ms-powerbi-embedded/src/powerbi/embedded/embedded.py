import logging
import json
import redis

from typing import List, Optional, Literal
from datetime import timedelta
from dateutil.parser import parse as parse_date
from datetime import datetime, timezone

from src.api import Api
from src.powerbi.auth import Auth
from src.powerbi.contracts.models import enumAuthScopes
from src.config import Settings

config = Settings()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

redis_client = redis.Redis(
    host=config.REDIS_HOST,
    port=config.REDIS_PORT,
    db=0,
    decode_responses=True
)

class Embedded:
    def __init__(
        self,
        mode: Literal["service-principal", "master-user"] = "service-principal"
    ) -> None:
        self.base_url = config.PB_BASE_URL
        self.access_token = Auth(scopes=enumAuthScopes.POWERBI.value).get_access_token(mode=mode)
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": self.access_token,
        }
    def _build_cache_key(
        self,
        dataset_ids: List[str],
        report_ids: List[str],
        username: Optional[str],
        roles: Optional[List[str]]
    ) -> str:
        key_parts = ["embedded_token"] + sorted(dataset_ids) + sorted(report_ids)

        if username:
            key_parts.append(f"user:{username}")
        if roles:
            key_parts.extend(sorted(roles))
        return ":".join(key_parts)

    def get_embedded_token(
        self,
        dataset_ids: List[str],
        report_ids: List[str],
        username: Optional[str] = None,
        roles: Optional[List[str]] = None
    ):
        cache_key = self._build_cache_key(dataset_ids, report_ids, username, roles)
        cached_token = redis_client.get(cache_key)
        if cached_token:
            logger.info(f"[EMBED] Token loaded from cache for reports {report_ids}")
            return json.loads(cached_token)

        data = {
            "datasets": [{"id": dts_id} for dts_id in dataset_ids],
            "reports": [{"id": report_id, "allowEdit": False} for report_id in report_ids],
        }

        if username:
            data["identities"] = [{
                "username": username,
                "roles": roles,
                "datasets": dataset_ids
            }]

        url = f"{self.base_url}/myorg/GenerateToken"
        response = Api(url=url, headers=self.headers, json=data).post()
        response.raise_for_status()

        embed_token = response.json()
        expires_in = embed_token.get("expiration")
        if not expires_in:
            raise Exception("Embed token response missing expiration")

        try:
            exp_time = parse_date(embed_token["expiration"])
            now = datetime.now(timezone.utc)
            ttl = max(int((exp_time - now).total_seconds()) - 60, 60)
        except Exception as e:
            logger.error(f"[EMBED] Error parsing expiration date: {e}")
            raise Exception("Invalid expiration time format")

        redis_client.setex(cache_key, timedelta(seconds=ttl), json.dumps(embed_token))
        logger.info(f"[EMBED] New token cached for {ttl} seconds for reports {report_ids}")
        return embed_token
