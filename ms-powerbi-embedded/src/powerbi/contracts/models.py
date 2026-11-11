from enum import Enum
from typing import Literal, Optional

from src.config import Settings

config = Settings()

class enumAuthScopes(Enum):
    GRAPH = ["https://graph.microsoft.com/.default"]
    POWERBI = ["https://analysis.windows.net/powerbi/api/.default"]

class MasterUserCredentials:
    username: str = config.PB_USERNAME
    password: str = config.PB_PASSWORD

class PowerBiApiPath:
    def __init__(self) -> None:
        self.base_url = config.PB_BASE_URL
    def get_path(
        self,
        resource: Literal["groups", "reports"] = "",
        mode: Literal["admin", "groups", "reports"] = "",
        mode_id: Optional[str] = None,
        resource_id: Optional[str] = None,
    ) -> str:
        if mode is not None and mode_id is not None and resource is not None and resource_id is not None:
            path = f"{self.base_url}/myorg/{mode}/{mode_id}/{resource}/{resource_id}"
            return path

        if resource != "":
            resource = f"/{resource}"

        if mode not in {"admin", "groups", "reports"}:
            raise ValueError("mode must be 'admin' or 'groups'")

        if mode not in ["admin", "reports"]:
            mode = ""
        else:
            mode = f"/{mode}"

        path = f"{self.base_url}/myorg{mode}{resource}"

        if resource_id:
            path += f"/{resource_id}"

        return path
