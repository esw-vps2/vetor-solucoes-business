from pydantic import BaseModel
from typing import List, Optional

class EmbedTokenRequest(BaseModel):
    dataset_ids: List[str]
    report_ids: List[str]
    username: Optional[str] = None
    roles: Optional[List[str]] = None
