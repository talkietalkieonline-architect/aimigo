"""Модель агента"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Integer, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    profession: Mapped[str] = mapped_column(String(100), index=True)
    brand: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(20), default="#d4a843")

    # system / business / citizen
    agent_type: Mapped[str] = mapped_column(String(30), default="business", index=True)

    # Aimigo Link — aimigo.com/a/tim-adidas
    aimigo_link: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)

    rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(default=0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Владелец агента (бизнес-пользователь). NULL = системный агент
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )

    # LLM: системный промпт для этого агента
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # LLM: модель (gpt-4o-mini / claude-3-haiku / и т.д.)
    llm_model: Mapped[str] = mapped_column(String(50), default="gpt-4o-mini")

    # Приветственное сообщение
    greeting: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
