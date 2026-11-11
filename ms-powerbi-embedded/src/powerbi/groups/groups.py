import logging

from typing import Literal, Union
from src.api import Api
from src.config import Settings
from src.powerbi.auth import Auth
from src.powerbi.contracts.models import enumAuthScopes, PowerBiApiPath

config = Settings()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class Groups:
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
    def get_groups(self) -> dict:
        url = PowerBiApiPath() \
            .get_path(resource="groups", mode="admin")
        url = f"{url}?$top=1000"

        try:
            response = Api(url=url, headers=self.headers).get()
            if response.status_code !=200 or not response.text:
                logger.error(f"Error fetching groups: {response.text}")
                raise Exception
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching groups: {e}")
            return None

    def create_group(self, name: str) -> dict:
        url = PowerBiApiPath() \
            .get_path(resource="groups", mode="groups")

        data = {
            "name": name + " - Embedded"
        }

        try:
            response = Api(url=url, headers=self.headers, json=data).post()
            if response.status_code !=200 or not response.text:
                logger.error(f"Error creating group: {response.text}")
                raise Exception
            return response.json()
        except Exception as e:
            logger.error(f"Error creating group: {e}")
            return {
                "name": name
            }
    def delete_group(self, group_id: str) -> dict:
        url = PowerBiApiPath() \
            .get_path(
                resource="groups",
                resource_id=group_id,
                mode="groups"
            )

        try:
            response = Api(url=url, headers=self.headers).delete()
            if response.status_code !=200 or not response.text:
                logger.error(f"Error deleting group: {response.text}")
                raise Exception
            return response
        except Exception as e:
            logger.error(f"Error deleting group: {e}")
            return response
    def get_groups_by_id(self, group_id: str) -> dict:
        url = PowerBiApiPath() \
            .get_path(
                resource="groups",
                resource_id=group_id,
                mode="admin"
            )

        try:
            response = Api(url=url, headers=self.headers).get()

            return response.json()
        except Exception as e:
            logger.error(f"Error fetching group details: {e}")
            return None
    def get_goups_by_name(self, operator: str, group_name: str) -> dict:
        url = PowerBiApiPath() \
            .get_path(
                resource="groups",
                mode="admin"
            )
        url = f"{url}?$top=1000"

        params = {
            "$filter": f"{operator}(name, '{group_name}')"
        }

        try:
            response = Api(url=url, headers=self.headers, params=params).get()

            if response.status_code !=200 or not response.text:
                logger.error(f"Error fetching group details: {response.text}")
                return None

            return response.json()
        except Exception as e:
            logger.error(f"Error fetching group details: {e}")
            return None

    def get_users_in_group(self, group_id: str) -> dict:
        url = PowerBiApiPath() \
            .get_path(
                resource="groups",
                resource_id=group_id,
                mode="admin"
            )
        url = f"{url}/users"

        try:
            response = Api(url=url, headers=self.headers).get()

            return response.json()
        except Exception as e:
            logger.error(f"Error fetching group details: {e}")
            return None

    def verify_if_user_exists_in_group(self, group_id: str, user_id: str) -> dict:
        try:
            response = self.get_users_in_group(group_id=group_id)
            users = response.get("value")

            if users:
                return True if sum([user_id in user_dict.values() for user_dict in users]) > 0 else False

            return False
        except Exception as e:
            logger.error(f"Failed to verify if user exists in group: {e}")
            return None

    def add_user_to_group(
        self,
        group_id: str,
        type: Union[Literal["user", "service_principal"], list] = ["user", "service_principal"],
        user: str = None,
    ) -> None:
        url = PowerBiApiPath() \
            .get_path(
                resource="groups",
                resource_id=group_id,
                mode="groups"
            )
        url = f"{url}/users"

        def define_payload_mode(type: str, user: str = None):

            match type:
                case "user":
                    if user is None:
                        user = config.PB_USERNAME
                    else:
                        user = user
                    parameters = {
                        "emailAddress": f"{user}",
                        "groupUserAccessRight": "Admin"
                    }
                case "service_principal":
                    if user is None:
                        user = config.PB_SERVICE_PRINCIPAL
                    else:
                        user = user
                    parameters = {
                        "identifier": f"{user}",
                        "groupUserAccessRight": "Admin",
                        "principalType": "App"
                    }

            return parameters, user

        def insert_user(payload: dict):
            try:
                response = Api(url=url, headers=self.headers, json=payload).post()

                return response.content

            except Exception as e:
                logger.error(f"Failed to add user to group: {e}")
                return None

        if user is None and isinstance(type, list):
            for user_type in type:
                payload, user = define_payload_mode(type=user_type, user=user)

                has_user = self.verify_if_user_exists_in_group(group_id=group_id, user_id=user)

                if has_user:
                    continue

                insert_user(payload=payload)

            return True

        else:
            payload, user = define_payload_mode(type=type)

            has_user = self.verify_if_user_exists_in_group(group_id=group_id, user_id=user)

            if has_user:
                return True

            insert_user(payload=payload)

            return True
