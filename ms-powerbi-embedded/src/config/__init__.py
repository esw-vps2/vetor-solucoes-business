from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PB_CLIENT_ID: str
    PB_CLIENT_SECRET: str
    PB_TENANT_ID: str
    PB_SERVICE_PRINCIPAL: str
    PB_BASE_URL: str
    PB_AUTHORITY_URL: str
    PB_USERNAME: str
    PB_PASSWORD: str
    REDIS_HOST: str
    REDIS_PORT: int = 6379
    API_KEY: str = ""

    class Config:
        env_file='.env'
        env_file_encoding='utf-8'
        extra='ignore'
