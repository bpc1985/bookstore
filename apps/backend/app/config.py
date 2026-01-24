from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./bookstore.db"
    secret_key: str = "dev-secret-key-not-for-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_mode: str = "sandbox"
    paypal_webhook_id: str = ""

    payment_retry_max_attempts: int = 3
    payment_retry_delay_seconds: int = 2

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
