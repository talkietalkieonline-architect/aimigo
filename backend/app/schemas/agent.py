"""Схемы агентов"""
from typing import List, Optional

from pydantic import BaseModel, Field


class AgentOut(BaseModel):
    """Public схема агента (для каталога)"""
    id: int
    name: str
    profession: str
    brand: str
    description: str
    color: str
    agent_type: str
    aimigo_link: Optional[str] = None
    rating: float
    rating_count: int
    greeting: Optional[str] = None
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True


class AgentDetailOut(AgentOut):
    """Полная схема агента (для админки и ЛК бизнеса)"""
    # AI
    system_prompt: Optional[str] = None
    llm_model: str = "gpt-4o-mini"
    is_active: bool = True
    created_at: Optional[str] = None

    # Голос
    voice_id: Optional[str] = None
    voice_speed: float = 1.0
    voice_pitch: float = 1.0

    # Внешность
    appearance_preset: Optional[str] = None
    appearance_face: Optional[str] = None
    appearance_hair: Optional[str] = None
    appearance_skin: Optional[str] = None
    appearance_body: Optional[str] = None

    # Одежда
    outfit_style: Optional[str] = None
    outfit_top: Optional[str] = None
    outfit_bottom: Optional[str] = None
    outfit_shoes: Optional[str] = None
    outfit_accessory: Optional[str] = None

    # Манеры
    manner_style: str = "friendly"
    manner_temperament: str = "balanced"
    manner_humor: bool = True
    manner_emoji_use: bool = True

    # Знания
    knowledge_text: Optional[str] = None
    knowledge_urls: Optional[str] = None
    knowledge_files: Optional[str] = None

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    agents: List[AgentOut]
    total: int
    business_count: int
    citizen_count: int
    system_count: int


class AgentCreate(BaseModel):
    """Создание нового агента (конструктор)"""
    name: str = Field(..., min_length=1, max_length=100)
    profession: str = Field(..., min_length=1, max_length=100)
    brand: str = Field("", max_length=100)
    description: str = Field("", max_length=2000)
    color: str = Field("#d4a843", max_length=20)
    agent_type: str = Field("business")
    system_prompt: Optional[str] = Field(None, max_length=5000)
    llm_model: str = Field("gpt-4o-mini")
    greeting: Optional[str] = Field(None, max_length=500)


class AgentUpdate(BaseModel):
    """Обновление агента (админ — всё, бизнес — часть)"""
    # Основное (админ)
    name: Optional[str] = Field(None, max_length=100)
    profession: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    color: Optional[str] = Field(None, max_length=20)

    # AI (админ + бизнес)
    system_prompt: Optional[str] = Field(None, max_length=5000)
    llm_model: Optional[str] = Field(None, max_length=50)
    greeting: Optional[str] = Field(None, max_length=500)

    # Голос (бизнес)
    voice_id: Optional[str] = Field(None, max_length=100)
    voice_speed: Optional[float] = Field(None, ge=0.5, le=2.0)
    voice_pitch: Optional[float] = Field(None, ge=0.5, le=2.0)

    # Внешность (бизнес)
    appearance_preset: Optional[str] = Field(None, max_length=100)
    appearance_face: Optional[str] = Field(None, max_length=100)
    appearance_hair: Optional[str] = Field(None, max_length=100)
    appearance_skin: Optional[str] = Field(None, max_length=50)
    appearance_body: Optional[str] = Field(None, max_length=100)

    # Одежда (бизнес)
    outfit_style: Optional[str] = Field(None, max_length=100)
    outfit_top: Optional[str] = Field(None, max_length=100)
    outfit_bottom: Optional[str] = Field(None, max_length=100)
    outfit_shoes: Optional[str] = Field(None, max_length=100)
    outfit_accessory: Optional[str] = Field(None, max_length=100)

    # Манеры (бизнес)
    manner_style: Optional[str] = Field(None, max_length=50)
    manner_temperament: Optional[str] = Field(None, max_length=50)
    manner_humor: Optional[bool] = None
    manner_emoji_use: Optional[bool] = None

    # Знания (бизнес)
    knowledge_text: Optional[str] = Field(None, max_length=50000)
    knowledge_urls: Optional[str] = Field(None, max_length=5000)
    knowledge_files: Optional[str] = Field(None, max_length=5000)
