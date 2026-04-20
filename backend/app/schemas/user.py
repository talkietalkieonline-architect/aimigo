"""Схемы пользователя"""
from typing import Optional

from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    phone: str
    display_name: str
    aimigo_link: Optional[str] = None
    theme: str
    avatar_color: str
    is_online: bool
    is_admin: bool = False

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    theme: Optional[str] = None
    avatar_color: Optional[str] = None
    bio: Optional[str] = None
