from pydantic_settings import BaseSettings, SettingsConfigDict

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./test.db"
    
    # AI / LLM
    OPENAI_API_KEY: str = "your-api-key-here"
    LLM_MODEL: str = "gpt-4o"
    
    # Vector Store
    CHROMA_DB_PATH: str = "./chroma_db"
    
    # App Settings
    APP_NAME: str = "AI Customer Support Platform"
    DEBUG: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

settings = Settings()
