"""API Город Агентов — каталог, поиск, фильтры, конструктор"""
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.agent import Agent
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentListResponse, AgentOut, AgentUpdate

router = APIRouter(prefix="/api/agents", tags=["agents"])


def _make_aimigo_link(name: str, brand: str) -> str:
    """Генерируем aimigo_link из имени и бренда"""
    slug = f"{name}-{brand}".lower().strip()
    slug = re.sub(r"[^a-z0-9\u0430-\u044f\u0451-]+", "-", slug)
    slug = slug.strip("-")[:80]
    return slug or "agent"


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


@router.get("/my", response_model=list[AgentOut])
async def my_agents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Мои агенты (созданные мной)"""
    result = await db.execute(
        select(Agent).where(Agent.owner_id == user.id, Agent.is_active == True)
        .order_by(Agent.created_at.desc())
    )
    agents = result.scalars().all()
    return [AgentOut.model_validate(a) for a in agents]


@router.get("/{agent_id}", response_model=AgentOut)
async def get_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Карточка агента"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.is_active == True))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")
    return AgentOut.model_validate(agent)


@router.post("", response_model=AgentOut, status_code=201)
async def create_agent(
    body: AgentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Конструктор: создать нового агента"""
    link = _make_aimigo_link(body.name, body.brand or user.display_name)

    # Проверяем уникальность link
    existing = await db.execute(select(Agent).where(Agent.aimigo_link == link))
    if existing.scalar_one_or_none():
        # Добавляем user_id для уникальности
        link = f"{link}-{user.id}"

    agent = Agent(
        name=body.name,
        profession=body.profession,
        brand=body.brand or user.display_name,
        description=body.description,
        color=body.color,
        agent_type=body.agent_type,
        aimigo_link=link,
        system_prompt=body.system_prompt,
        llm_model=body.llm_model,
        greeting=body.greeting,
        owner_id=user.id,
    )
    db.add(agent)
    await db.flush()
    await db.refresh(agent)
    return AgentOut.model_validate(agent)


@router.patch("/{agent_id}", response_model=AgentOut)
async def update_agent(
    agent_id: int,
    body: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Обновить агента (только владелец)"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.is_active == True))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")
    if agent.owner_id != user.id:
        raise HTTPException(403, "Нет доступа")

    for field in ["name", "profession", "brand", "description", "color", "system_prompt", "llm_model", "greeting"]:
        value = getattr(body, field, None)
        if value is not None:
            setattr(agent, field, value)

    await db.flush()
    return AgentOut.model_validate(agent)


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Удалить агента (мягкое удаление, только владелец)"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")
    if agent.owner_id != user.id:
        raise HTTPException(403, "Нет доступа")

    agent.is_active = False
    await db.flush()
