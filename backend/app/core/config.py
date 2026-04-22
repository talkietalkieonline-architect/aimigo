"""Конфигурация приложения"""
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Приложение
    APP_NAME: str = "Aimigo"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://aimigo:aimigo@localhost:5432/aimigo"
    DATABASE_URL_SYNC: str = "postgresql://aimigo:aimigo@localhost:5432/aimigo"

    # JWT
    SECRET_KEY: str = "aimigo-dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 дней

    # SMS (заглушка для MVP)
    SMS_CODE_EXPIRE_MINUTES: int = 5
    SMS_CODE_LENGTH: int = 4

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM — мульти-провайдер
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Провайдер по умолчанию для Дворецкого: openai / gemini / groq
    DEFAULT_LLM_PROVIDER: str = "gemini"

    # Админка — номера телефонов админов (при регистрации получают is_admin=True)
    ADMIN_PHONES: List[str] = []

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
