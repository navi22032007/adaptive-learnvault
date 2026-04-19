from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Adaptive LearnVault API"
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GEMINI_API_KEY: Optional[str] = None
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "learnvault"
    YOUTUBE_API_KEY: Optional[str] = None
    NVIDIA_API_KEY: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
