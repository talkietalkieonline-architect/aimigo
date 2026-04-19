"""API Город Агентов — каталог, поиск, фильтры"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentListResponse, AgentOut

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=AgentListResponse)
async def list_agents(
    search: str = Query("", description="Поиск по имени, профессии, бренду"),
    profession: str = Query("", description="Фильтр по профессии"),
    agent_type: str = Query("", description="Фильтр по типу: business, citizen, system"),
    db: AsyncSession = Depends(get_db),
):
    """Каталог агентов с поиском и фильтрами"""
    query = select(Agent).where(Agent.is_active == True)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            Agent.name.ilike(pattern)
            | Agent.profession.ilike(pattern)
            | Agent.brand.ilike(pattern)
        )

    if profession:
        query = query.where(Agent.profession == profession)

    if agent_type:
        query = query.where(Agent.agent_type == agent_type)

    query = query.order_by(Agent.rating.desc(), Agent.name)

    result = await db.execute(query)
    agents = result.scalars().all()

    # Счётчики (по всей базе, не по фильтру)
    total_result = await db.execute(select(func.count(Agent.id)).where(Agent.is_active == True))
    total = total_result.scalar() or 0

    biz_result = await db.execute(
        select(func.count(Agent.id)).where(Agent.is_active == True, Agent.agent_type == "business")
    )
    business_count = biz_result.scalar() or 0

    cit_result = await db.execute(
        select(func.count(Agent.id)).where(Agent.is_active == True, Agent.agent_type == "citizen")
    )
    citizen_count = cit_result.scalar() or 0

    sys_result = await db.execute(
        select(func.count(Agent.id)).where(Agent.is_active == True, Agent.agent_type == "system")
    )
    system_count = sys_result.scalar() or 0

    return AgentListResponse(
        agents=[AgentOut.model_validate(a) for a in agents],
        total=total,
        business_count=business_count,
        citizen_count=citizen_count,
        system_count=system_count,
    )


@router.get("/{agent_id}", response_model=AgentOut)
async def get_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Карточка агента"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.is_active == True))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")
    return AgentOut.model_validate(agent)
