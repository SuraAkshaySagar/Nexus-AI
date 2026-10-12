import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    APP_NAME: str = "NEXUS AI Orchestration Engine"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS configuration
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Database
    DATABASE_URL: str = "sqlite:///./nexus_data.db"

    # Lyzr Agent Studio & Manager Agent configuration
    LYZR_API_KEY: str = Field(default="", description="Lyzr Studio API Key")
    LYZR_AGENT_ID: str = Field(default="", description="Default Lyzr Manager Agent ID")
    LYZR_BASE_URL: str = "https://agent-prod.lyzr.ai"

    # Qdrant Vector DB configuration
    QDRANT_URL: str = Field(
        default="https://d99af7c1-3fa8-40d0-84c3-8212924e8fe6.eu-west-1-0.aws.cloud.qdrant.io",
        description="Qdrant cluster endpoint"
    )
    QDRANT_API_KEY: str = Field(
        default="",
        description="Qdrant cluster API key"
    )
    QDRANT_COLLECTION: str = "nexus_memory"
    VECTOR_DIMENSION: int = 384
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # Omi Voice Integration
    OMI_WEBHOOK_SECRET: str = Field(default="nexus_omi_webhook_secret_key", description="Omi webhook secret key")

    @field_validator("QDRANT_API_KEY", mode="before")
    @classmethod
    def clean_qdrant_key(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lstrip(".")
        return v

    @property
    def cors_origin_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
