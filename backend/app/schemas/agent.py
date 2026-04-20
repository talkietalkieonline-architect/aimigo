"""Схемы агентов"""
from typing import List, Optional

from pydantic import BaseModel, Field


class AgentOut(BaseModel):
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
    """Обновление агента"""
    name: Optional[str] = Field(None, max_length=100)
    profession: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    color: Optional[str] = Field(None, max_length=20)
    system_prompt: Optional[str] = Field(None, max_length=5000)
    llm_model: Optional[str] = Field(None, max_length=50)
    greeting: Optional[str] = Field(None, max_length=500)
