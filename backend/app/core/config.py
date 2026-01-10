from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TTS Content Studio"
    APP_VERSION: str = "1.0.0"

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    MODELS_DIR: Path = STORAGE_DIR / "models"
    AUDIO_DIR: Path = STORAGE_DIR / "audio"

    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/tts_studio.db"

    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        case_sensitive = True


settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(exist_ok=True)
settings.MODELS_DIR.mkdir(exist_ok=True)
settings.AUDIO_DIR.mkdir(exist_ok=True)
