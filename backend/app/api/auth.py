"""API авторизации — телефон + SMS + пароль"""
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    SendSMSRequest,
    SendSMSResponse,
    SetPasswordRequest,
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


@router.post("/verify-sms")
async def verify_sms(body: VerifySMSRequest, db: AsyncSession = Depends(get_db)):
    """Проверить SMS-код"""
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user or not user.sms_code:
        raise HTTPException(400, "Сначала запросите SMS-код")

    if user.sms_code_expires and user.sms_code_expires < datetime.now(timezone.utc):
        raise HTTPException(400, "Код истёк, запросите новый")

    if user.sms_code != body.code:
        raise HTTPException(400, "Неверный код")

    user.is_verified = True
    user.sms_code = None
    user.sms_code_expires = None
    await db.flush()

    return {"message": "Код подтверждён", "verified": True}


@router.post("/set-password", response_model=TokenResponse)
async def set_password(body: SetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Установить пароль (регистрация) — после подтверждения SMS"""
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(400, "Пользователь не найден")

    if not user.is_verified:
        raise HTTPException(400, "Сначала подтвердите номер телефона")

    if len(body.password) < 4:
        raise HTTPException(400, "Пароль должен быть не менее 4 символов")

    user.password_hash = hash_password(body.password)

    # Генерируем aimigo_link если нет
    if not user.aimigo_link:
        user.aimigo_link = f"user-{user.id}"

    await db.flush()

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        display_name=user.display_name,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Вход по телефону + паролю"""
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный номер или пароль")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный номер или пароль")

    user.is_online = True
    user.last_seen = datetime.now(timezone.utc)
    await db.flush()

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        display_name=user.display_name,
    )
