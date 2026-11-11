import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Base directory (backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    # Database: Support DATABASE_URL or POSTGRES_URL env var
    DATABASE_URL: Optional[str] = None
    POSTGRES_URL: Optional[str] = None
    
    def __init__(self, **data):
        super().__init__(**data)
        db_url = self.DATABASE_URL or self.POSTGRES_URL
        if not db_url:
            db_url = f"sqlite:///{BASE_DIR / 'test.db'}"

        # Ensure compatibility with SQLAlchemy 2.0 and psycopg2-binary
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        self.DATABASE_URL = db_url

        if os.environ.get("VERCEL"):
            if not self.DATABASE_URL.startswith("postgresql") and not self.DATABASE_URL.startswith("postgres"):
                raise ValueError(
                    "CRITICAL PRODUCTION ERROR: DATABASE_URL or POSTGRES_URL environment variable with a PostgreSQL connection string "
                    "(e.g., Supabase, Neon) is required on Vercel for production persistence."
                )
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
