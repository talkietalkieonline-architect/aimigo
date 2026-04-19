"""Схемы авторизации"""
from typing import Optional

from pydantic import BaseModel


class SendSMSRequest(BaseModel):
    phone: str


class SendSMSResponse(BaseModel):
    message: str
    # В MVP возвращаем код в ответе (в продакшене — отправка реального SMS)
    debug_code: Optional[str] = None


class VerifySMSRequest(BaseModel):
    phone: str
    code: str


class SetPasswordRequest(BaseModel):
    phone: str
    code: str
    password: str


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    display_name: str
