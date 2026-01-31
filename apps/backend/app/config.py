import os
from pydantic_settings import BaseSettings
from functools import lru_cache


def get_database_url() -> str:
    """Get database URL, converting Render's postgres:// to postgresql+asyncpg://"""
    url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./bookstore.db")
    # Render uses postgres://, but SQLAlchemy asyncpg needs postgresql+asyncpg://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    database_url: str = get_database_url()
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-not-for-production")
    algorithm: str =  os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

    payment_retry_max_attempts: int = 3
    payment_retry_delay_seconds: int = 2

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
