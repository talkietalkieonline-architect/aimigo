которых создан магазин скорректировать """API авторизации — только SMS (SMS-only, без пароля)"""
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import (
    SendSMSRequest,
    SendSMSResponse,
    TokenResponse,
    VerifySMSRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/send-sms", response_model=SendSMSResponse)
async def send_sms(body: SendSMSRequest, db: AsyncSession = Depends(get_db)):
    """Отправить SMS-код (MVP — возвращаем код в ответе)"""
    phone = body.phone.strip()
    if not phone:
        raise HTTPException(400, "Номер телефона обязателен")

    # Генерируем код
    code = "".join([str(random.randint(0, 9)) for _ in range(settings.SMS_CODE_LENGTH)])
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.SMS_CODE_EXPIRE_MINUTES)

    # Ищем существующего пользователя или создаём нового
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    if user:
        user.sms_code = code
        user.sms_code_expires = expires
    else:
        user = User(
            phone=phone,
            password_hash="",
            sms_code=code,
            sms_code_expires=expires,
        )
        db.add(user)

    await db.flush()

    return SendSMSResponse(
        message="Код отправлен",
        debug_code=code if settings.DEBUG else None,
    )


@router.post("/verify-sms", response_model=TokenResponse)
async def verify_sms(body: VerifySMSRequest, db: AsyncSession = Depends(get_db)):
    """Проверить SMS-код → сразу выдать JWT (без пароля)"""
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user or not user.sms_code:
        raise HTTPException(400, "Сначала запросите SMS-код")

    if user.sms_code_expires and user.sms_code_expires < datetime.now(timezone.utc):
        raise HTTPException(400, "Код истёк, запросите новый")

    if user.sms_code != body.code:
        raise HTTPException(400, "Неверный код")

    # Успешная верификация
    user.is_verified = True
    user.sms_code = None
    user.sms_code_expires = None
    user.is_online = True
    user.last_seen = datetime.now(timezone.utc)

    if not user.aimigo_link:
        user.aimigo_link = f"user-{user.id}"

    await db.flush()

    # Сразу выдаём JWT — без пароля
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        display_name=user.display_name,
    )
