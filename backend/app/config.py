import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./clientops.db"
    )
    API_KEY: str = os.getenv("API_KEY", "clientops-secret-key-2026")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
