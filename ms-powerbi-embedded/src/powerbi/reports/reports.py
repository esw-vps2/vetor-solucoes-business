import logging

from typing import Literal

from src.api import Api
from src.powerbi.auth import Auth
from src.powerbi.contracts.models import enumAuthScopes
from src.config import Settings
from src.powerbi.contracts.models import PowerBiApiPath

config = Settings()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class Reports:
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
    def get_reports(self, group_id: str) -> dict:
        url = PowerBiApiPath() \
            .get_path(
                resource="groups",
                resource_id=group_id,
                mode="admin"
            )
        url = f"{url}/reports"

        try:
            response = Api(url=url, headers=self.headers).get()

            return response.json()
        except Exception as e:
            logger.error(f"Error fetching group details: {e}")
            return None

    def get_report_by_id(self, group_id: str, report_id: str) -> dict:
        url = PowerBiApiPath() \
            .get_path(
                resource="reports",
                resource_id=report_id,
                mode="groups",
                mode_id=group_id,
            )

        try:
            response = Api(url=url, headers=self.headers).get()
            if response.status_code !=200 or not response.text:
                logger.error(f"Error fetching group details: {response.text}")
                raise Exception
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching group details: {e}")
            return None
    def get_report_pages(self, group_id: str, report_id: str) -> dict:

        url = PowerBiApiPath() \
            .get_path(
                resource="reports",
                resource_id=report_id,
                mode="groups",
                mode_id=group_id,
            )
        url = f"{url}/pages"
        try:
            response = Api(url=url, headers=self.headers).get()
            if response.status_code !=200 or not response.text:
                logger.error(f"Error fetching group details: {response.text}")
                raise Exception
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching group details: {e}")
            return None
