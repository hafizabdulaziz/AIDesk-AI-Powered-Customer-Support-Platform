import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Base directory (backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'test.db'}"
    
    def __init__(self, **data):
        super().__init__(**data)
        if os.environ.get("VERCEL"):
            self.DATABASE_URL = "sqlite:///:memory:"
            self.CHROMA_DB_PATH = "/tmp/chroma_db"
    
    # AI / LLM
    OPENAI_API_KEY: Optional[str] = "ollama"
    GROQ_API_KEY: Optional[str] = None
    LLM_MODEL: str = "llama3.2:latest"
    EMBEDDING_MODEL: str = "text-embedding-004"
    API_BASE_URL: str = "http://localhost:11434/v1"
    GROQ_API_BASE_URL: str = "http://localhost:11434/v1"
    
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
