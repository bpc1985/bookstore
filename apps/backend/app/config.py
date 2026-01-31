from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # pydantic-settings automatically reads from env vars (case-insensitive)
    database_url: str = "sqlite+aiosqlite:///./bookstore.db"
    secret_key: str = "dev-secret-key-not-for-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    payment_retry_max_attempts: int = 3
    payment_retry_delay_seconds: int = 2

    @field_validator("database_url", mode="after")
    @classmethod
    def convert_database_url(cls, v: str) -> str:
        """Convert Render's postgres:// to postgresql+asyncpg:// for async SQLAlchemy"""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
