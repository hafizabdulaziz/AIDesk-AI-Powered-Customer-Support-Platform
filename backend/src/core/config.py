import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Base directory (backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    # Database (always absolute path to backend/test.db)
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'test.db'}"
    
    # AI / LLM
    OPENAI_API_KEY: str 
    LLM_MODEL: str = "gemini-1.5-flash"
    EMBEDDING_MODEL: str = "text-embedding-004"
    API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    
    # Vector Store (always absolute path to backend/chroma_db)
    CHROMA_DB_PATH: str = str(BASE_DIR / "chroma_db")
    
    # App Settings
    APP_NAME: str = "AI Customer Support Platform"
    DEBUG: bool = True
    
    # Mock Mode
    MOCK_MODE: bool = False

    model_config = SettingsConfigDict(
        env_file=ENV_FILE, 
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
