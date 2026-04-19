"""Модель пользователя"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100), default="Пользователь")
    aimigo_link: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)

    # Статус
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)

    # Настройки
    theme: Mapped[str] = mapped_column(String(50), default="noir-gold")
    avatar_color: Mapped[str] = mapped_column(String(20), default="#d4a843")

    # SMS-верификация
    sms_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    sms_code_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Мета
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
