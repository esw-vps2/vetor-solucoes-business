import redis

from http import HTTPStatus
from typing import Optional, Literal

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from src.config import Settings

from src.powerbi.auth import Auth
from src.powerbi.contracts.models import enumAuthScopes
from src.powerbi.groups.groups import Groups
from src.powerbi.reports.reports import Reports
from src.powerbi.embedded.embedded import Embedded
from src.schemas import EmbedTokenRequest

config = Settings()
routes = APIRouter()

@routes.get(
    path="/health",
    response_class=JSONResponse,
    summary="Health check",
    tags=["Health"],
    description="Verifica se o serviço está operacional",
    status_code=HTTPStatus.OK
)
async def health():
    return JSONResponse(
        status_code=HTTPStatus.OK,
        content={"status": "healthy"}
    )

@routes.get(
    path="/token_application",
    response_class=JSONResponse,
    summary="Get Power BI token application",
    tags=["Auth"],
    description="Route to get Power BI token application",
    status_code=HTTPStatus.OK
)
async def get_token_application():
    token_application = Auth(scopes=enumAuthScopes.POWERBI.value).get_access_token()
    response = {"access_token": token_application}
    return JSONResponse(status_code=HTTPStatus.OK, content=response)

@routes.get(
    path="/token_application/cache_status",
    response_class=JSONResponse,
    summary="Get Power BI token application status",
    tags=["Auth"],
    description="Route to get Power BI token application status from Redis",
    status_code=HTTPStatus.OK
)
async def token_status():
    redis_client = redis.Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        db=0,
        decode_responses=True
    )
    ttl = redis_client.ttl("powerbi_access_token")
    return {"ttl_in_seconds": ttl}

@routes.get(
    path="/groups",
    response_class=JSONResponse,
    summary="Get Power BI groups",
    tags=["Groups"],
    description="Route to get Power BI Groups",
    status_code=HTTPStatus.OK
)
async def get_groups(
    group_name: Optional[str] = None,
    operator: Optional[Literal["contains", "startswith", "endswith"]] = None
):

    if group_name:
        groups = Groups().get_goups_by_name(operator=operator, group_name=group_name)

        if not groups:
            return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Groups not found"})

        return JSONResponse(status_code=HTTPStatus.OK, content=groups)
    groups = Groups().get_groups()

    if not groups:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Groups not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=groups)

@routes.post(
    path="/groups",
    response_class=JSONResponse,
    summary="Create Power BI groups",
    tags=["Groups"],
    description="Route to create Power BI Groups",
    status_code=HTTPStatus.OK
)
async def create_group(name: str):
    group = Groups().create_group(name=name)

    if not group:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Group not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=group)

@routes.get(
    path="/groups/{group_id}",
    response_class=JSONResponse,
    summary="Get Power BI groups by id",
    tags=["Groups"],
    description="Route to get Power BI Groups by id",
    status_code=HTTPStatus.OK
)
async def get_groups_by_id(group_id: str):
    group = Groups().get_groups_by_id(group_id=group_id)

    if not group:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Group not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=group)

@routes.delete(
    path="/groups/{group_id}",
    response_class=JSONResponse,
    summary="Delete Power BI groups",
    tags=["Groups"],
    description="Route to remove Power BI Groups",
    status_code=HTTPStatus.OK
)
async def delete_group(group_id: str):
    response = Groups().delete_group(group_id=group_id)

    if response.status_code != 200:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Group not found"})

    group = {"message": f"Group: {group_id} deleted successfully"}
    return JSONResponse(status_code=HTTPStatus.OK, content=group)

@routes.get(
    path="/groups/{group_id}/users",
    response_class=JSONResponse,
    summary="Get Power BI users in groups by id",
    tags=["Groups"],
    description="Route to get Power BI users in Groups by id",
    status_code=HTTPStatus.OK
)
async def get_users_in_group_by_id(group_id: str):
    users = Groups().get_users_in_group(group_id=group_id)

    if not users:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Users not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=users)

@routes.post(
    path="/groups/{group_id}/users/{identifier}",
    response_class=JSONResponse,
    summary="Add users in groups by id",
    tags=["Groups"],
    description="Add users as admin in Groups by identifier",
    status_code=HTTPStatus.OK
)
async def add_user_to_group(group_id: str, identifier: str):
    response = Groups().add_user_to_group(
        group_id=group_id,
        type="service_principal",
        user=identifier
    )

    if not response:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "User not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=response)

@routes.get(
    path="/groups/{group_id}/reports",
    response_class=JSONResponse,
    summary="Get Power BI reports",
    tags=["Reports"],
    description="Route to get Power BI Reports Informations",
    status_code=HTTPStatus.OK
)
def get_reports(group_id: str):
    reports = Reports().get_reports(group_id=group_id)

    if not reports:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Reports not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=reports)

@routes.get(
    path="/groups/{group_id}/reports/{report_id}",
    response_class=JSONResponse,
    summary="Get Power BI reports",
    tags=["Reports"],
    description="Route to get Power BI Reports Informations",
    status_code=HTTPStatus.OK
)
def get_report_by_id(group_id: str, report_id: str):
    report = Reports().get_report_by_id(group_id=group_id, report_id=report_id)

    if not report:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Report not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=report)

@routes.get(
    path="/groups/{group_id}/reports/{report_id}/pages",
    response_class=JSONResponse,
    summary="Get Power BI reports pages",
    tags=["Reports"],
    description="Route to get Power BI Reports pages Informations",
    status_code=HTTPStatus.OK
)
def get_report_pages(group_id: str, report_id: str):
    report_pages = Reports().get_report_pages(group_id=group_id, report_id=report_id)

    if not report_pages:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Report pages not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=report_pages)

@routes.post(
    path="/reports/GenerateToken",
    response_class=JSONResponse,
    summary="Get Power BI report token",
    tags=["Embedding"],
    description="Route to get Power BI Report token for embedding",
    status_code=HTTPStatus.OK
)
def get_report_token(request: EmbedTokenRequest = Body(...)):
    embedded_token = Embedded().get_embedded_token(
        dataset_ids=request.dataset_ids,
        report_ids=request.report_ids,
        username=request.username,
        roles=request.roles
    )

    if not embedded_token:
        return JSONResponse(status_code=HTTPStatus.NOT_FOUND, content={"message": "Report token not found"})

    return JSONResponse(status_code=HTTPStatus.OK, content=embedded_token)
