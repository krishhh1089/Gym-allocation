from typing import List

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database (supports DATABASE_URL or STUDENT_DB_URL)
    database_url: str = Field(
        default="sqlite+aiosqlite:///:memory:",
        validation_alias=AliasChoices("DATABASE_URL", "STUDENT_DB_URL"),
    )

    # JWT (shared secret with Identity Service for token verification)
    jwt_secret: str = Field(
        default="change-me",
        validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"),
    )
    secret_key: str = Field(
        default="change-me",
        validation_alias=AliasChoices("SECRET_KEY", "JWT_SECRET"),
    )
    jwt_algorithm: str = "HS256"

    # CORS
    allowed_origins: str = "*"

    # App
    app_env: str = "development"
    service_name: str = "student-service"
    service_version: str = "1.0.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        if self.allowed_origins == "*":
            return ["*"]
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


settings = Settings()
