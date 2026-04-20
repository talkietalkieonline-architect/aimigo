"""
Admin API — управление всеми агентами, пользователями, системой.
Доступен только пользователям с is_admin=True.
"""
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.agent import Agent
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentDetailOut, AgentUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _make_aimigo_link(name: str, brand: str) -> str:
    """Генерируем aimigo_link из имени и бренда"""
    slug = f"{name}-{brand}".lower().strip()
    slug = re.sub(r"[^a-z0-9\u0430-\u044f\u0451-]+", "-", slug)
    slug = slug.strip("-")[:80]
    return slug or "agent"


# ═══════════════════════════════════════════════
#  АГЕНТЫ
# ═══════════════════════════════════════════════

@router.get("/agents", response_model=list[AgentDetailOut])
async def admin_list_agents(
    search: str = Query("", description="Поиск"),
    agent_type: str = Query("", description="Фильтр: system / business / citizen"),
    include_inactive: bool = Query(False, description="Включая удалённых"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Все агенты (включая удалённых). Полные данные с промптами."""
    query = select(Agent)

    if not include_inactive:
        query = query.where(Agent.is_active == True)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            Agent.name.ilike(pattern)
            | Agent.profession.ilike(pattern)
            | Agent.brand.ilike(pattern)
        )

    if agent_type:
        query = query.where(Agent.agent_type == agent_type)

    query = query.order_by(Agent.agent_type, Agent.name)
    result = await db.execute(query)
    agents = result.scalars().all()

    return [AgentDetailOut.model_validate(a) for a in agents]


@router.get("/agents/{agent_id}", response_model=AgentDetailOut)
async def admin_get_agent(
    agent_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Полная карточка агента с промптом и настройками"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")
    return AgentDetailOut.model_validate(agent)


@router.post("/agents", response_model=AgentDetailOut, status_code=201)
async def admin_create_agent(
    body: AgentCreate,
    owner_id: Optional[int] = Query(None, description="ID бизнес-пользователя (привязка)"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """
    Создать агента (системного, бизнес, жителя).
    owner_id — к какому бизнес-пользователю привязать (необязательно).
    """
    link = _make_aimigo_link(body.name, body.brand or "aimigo")

    # Уникальность link
    existing = await db.execute(select(Agent).where(Agent.aimigo_link == link))
    if existing.scalar_one_or_none():
        # Добавляем суффикс
        cnt = (await db.execute(select(func.count(Agent.id)))).scalar() or 0
        link = f"{link}-{cnt + 1}"

    # Проверяем owner_id
    if owner_id:
        owner_result = await db.execute(select(User).where(User.id == owner_id, User.is_active == True))
        if not owner_result.scalar_one_or_none():
            raise HTTPException(400, f"Пользователь {owner_id} не найден")

    agent = Agent(
        name=body.name,
        profession=body.profession,
        brand=body.brand or "Aimigo",
        description=body.description,
        color=body.color,
        agent_type=body.agent_type,
        aimigo_link=link,
        system_prompt=body.system_prompt,
        llm_model=body.llm_model,
        greeting=body.greeting,
        owner_id=owner_id,
    )
    db.add(agent)
    await db.flush()
    await db.refresh(agent)
    return AgentDetailOut.model_validate(agent)


@router.patch("/agents/{agent_id}", response_model=AgentDetailOut)
async def admin_update_agent(
    agent_id: int,
    body: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Обновить любого агента (все поля)"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")

    for field in body.model_fields_set:
        value = getattr(body, field, None)
        if value is not None and hasattr(agent, field):
            setattr(agent, field, value)

    await db.flush()
    return AgentDetailOut.model_validate(agent)


@router.patch("/agents/{agent_id}/assign", response_model=AgentDetailOut)
async def admin_assign_agent(
    agent_id: int,
    owner_id: Optional[int] = Query(None, description="ID бизнес-пользователя (null = отвязать)"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Привязать/отвязать агента к бизнес-пользователю"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")

    if owner_id is not None:
        owner_result = await db.execute(select(User).where(User.id == owner_id, User.is_active == True))
        if not owner_result.scalar_one_or_none():
            raise HTTPException(400, f"Пользователь {owner_id} не найден")

    agent.owner_id = owner_id
    await db.flush()
    return AgentDetailOut.model_validate(agent)


@router.delete("/agents/{agent_id}", status_code=204)
async def admin_delete_agent(
    agent_id: int,
    hard: bool = Query(False, description="Жёсткое удаление (навсегда)"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Удалить агента (мягкое по умолчанию, hard=true — навсегда)"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")

    if hard:
        await db.delete(agent)
    else:
        agent.is_active = False

    await db.flush()


@router.patch("/agents/{agent_id}/restore", response_model=AgentDetailOut)
async def admin_restore_agent(
    agent_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Восстановить мягко-удалённого агента"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(404, "Агент не найден")

    agent.is_active = True
    await db.flush()
    return AgentDetailOut.model_validate(agent)


# ═══════════════════════════════════════════════
#  ПОЛЬЗОВАТЕЛИ
# ═══════════════════════════════════════════════

@router.get("/users")
async def admin_list_users(
    search: str = Query(""),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Список пользователей"""
    query = select(User).where(User.is_active == True)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            User.phone.ilike(pattern)
            | User.display_name.ilike(pattern)
        )

    query = query.order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return [
        {
            "id": u.id,
            "phone": u.phone,
            "display_name": u.display_name,
            "is_admin": u.is_admin,
            "is_online": u.is_online,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


# ═══════════════════════════════════════════════
#  СТАТИСТИКА
# ═══════════════════════════════════════════════

@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Общая статистика платформы"""
    agents_total = (await db.execute(select(func.count(Agent.id)).where(Agent.is_active == True))).scalar() or 0
    agents_system = (await db.execute(select(func.count(Agent.id)).where(Agent.is_active == True, Agent.agent_type == "system"))).scalar() or 0
    agents_business = (await db.execute(select(func.count(Agent.id)).where(Agent.is_active == True, Agent.agent_type == "business"))).scalar() or 0
    agents_citizen = (await db.execute(select(func.count(Agent.id)).where(Agent.is_active == True, Agent.agent_type == "citizen"))).scalar() or 0
    users_total = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar() or 0

    return {
        "agents": {
            "total": agents_total,
            "system": agents_system,
            "business": agents_business,
            "citizen": agents_citizen,
        },
        "users": {
            "total": users_total,
        },
    }
