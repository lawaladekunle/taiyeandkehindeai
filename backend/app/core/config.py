from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/medcomms"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-change-in-production"
    anthropic_api_key: str = ""
    environment: str = "development"
    log_level: str = "info"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
