from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Adaptive LearnVault API"
    DATABASE_URL: str = "sqlite:///database.db"
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GEMINI_API_KEY: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
