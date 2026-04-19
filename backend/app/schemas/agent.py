"""Схемы агентов"""
from typing import List, Optional

from pydantic import BaseModel


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

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    agents: List[AgentOut]
    total: int
    business_count: int
    citizen_count: int
    system_count: int
