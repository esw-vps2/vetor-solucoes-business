import redis
import json
import logging

from redis.exceptions import LockError

from time import sleep
from datetime import timedelta
from typing import Literal

from msal import ConfidentialClientApplication
from src.api.instance import Session
from src.config import Settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

config = Settings()

class Auth:
    def __init__(self, scopes: list):
        self.client_id = config.PB_CLIENT_ID
        self.client_secret = config.PB_CLIENT_SECRET
        self.tenant_id = config.PB_TENANT_ID
        self.session = Session().get()
        self.authority_url = f"{config.PB_AUTHORITY_URL}{self.tenant_id}"
        self.scopes = scopes
        self.app = ConfidentialClientApplication(
            client_id=self.client_id,
            authority=self.authority_url,
            client_credential=self.client_secret,
            http_client=self.session
        )
        self.redis_client = redis.Redis(
            host=config.REDIS_HOST,
            port=config.REDIS_PORT,
            db=0,
            decode_responses=True
        )
    def acquire_token(self, mode: Literal["service-principal", "master-user"] = "service-principal"):
        cache_key = "powerbi_access_token"
        token_data = self.redis_client.get(cache_key)

        if token_data:
            self.authorization = json.loads(token_data)
            ttl = self.redis_client.ttl(cache_key)
            logger.info(f"[AUTH] Token loaded from Redis cache. Remaining TTL: {ttl} seconds.")
            return self.authorization

        logger.info("[AUTH] No valid token found in Redis. Attempting to acquire lock to fetch a new token...")

        try:
            with self.redis_client.lock("token_lock", blocking_timeout=5):
                logger.info("[AUTH] Lock acquired. Checking cache again before requesting new token...")

                token_data = self.redis_client.get(cache_key)
                if token_data:
                    self.authorization = json.loads(token_data)
                    ttl = self.redis_client.ttl(cache_key)
                    logger.info(f"[AUTH] Token was refreshed by another process. TTL: {ttl} seconds.")
                    return self.authorization

                match mode:
                    case "service-principal":
                        try:
                            self.authorization = self.app.acquire_token_for_client(scopes=self.scopes)
                        except Exception as e:
                            logger.error(f"[AUTH] Failed to acquire token via service-principal: {e}")
                            raise
                    case "master-user":
                        try:
                            self.authorization = self.app.acquire_token_by_username_password(
                                username=config.PB_USERNAME,
                                password=config.PB_PASSWORD,
                                scopes=self.scopes
                            )
                        except Exception as e:
                            logger.error(f"[AUTH] Failed to acquire token via master-user: {e}")
                            raise

                if self.authorization.get("access_token"):
                    expires_in = self.authorization.get("expires_in", 3600)
                    ttl = expires_in - 60
                    self.redis_client.setex(
                        cache_key,
                        timedelta(seconds=ttl),
                        json.dumps(self.authorization)
                    )
                    logger.info(f"[AUTH] New token stored in Redis with TTL of {ttl} seconds.")
                    return self.authorization

        except LockError:
            logger.warning("[AUTH] Could not acquire lock to refresh token. Another process is likely handling it.")

            sleep(1)
            token_data = self.redis_client.get(cache_key)
            if token_data:
                self.authorization = json.loads(token_data)
                ttl = self.redis_client.ttl(cache_key)
                logger.info(f"[AUTH] Token loaded after waiting. TTL: {ttl} seconds.")
                return self.authorization
            else:
                logger.error("[AUTH] Token still missing after lock wait. Fallback failed.")
                raise RuntimeError("Failed to retrieve access token after lock timeout.")
    def get_access_token(self, mode: Literal["service-principal","master-user"] = "service-principal"):
        self.acquire_token(mode=mode)
        return f"{self.authorization['token_type']} {self.authorization['access_token']}"
