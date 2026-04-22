"""WebSocket эндпоинт для чата с LLM-ответами"""
import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import async_session
from app.core.security import decode_access_token
from app.models.agent import Agent
from app.models.message import Message
from app.models.user import User
from app.services.llm import get_llm_reply, get_agent_reply
from app.websocket.manager import manager

router = APIRouter()

# Regex для определения комнаты агента: agent-{id}
_AGENT_ROOM_RE = re.compile(r"^agent-(\d+)$")


def _parse_agent_room(room: str) -> Optional[int]:
    """Если комната agent-{id} — вернуть id агента, иначе None"""
    m = _AGENT_ROOM_RE.match(room)
    return int(m.group(1)) if m else None


async def _load_agent(agent_id: int) -> Optional[Agent]:
    """Загрузить агента из БД"""
    async with async_session() as db:
        result = await db.execute(
            select(Agent).where(Agent.id == agent_id, Agent.is_active == True)
        )
        return result.scalar_one_or_none()


async def _get_conversation_history(room: str, limit: int = 10) -> list:
    """Получить последние сообщения для контекста LLM"""
    async with async_session() as db:
        result = await db.execute(
            select(Message)
            .where(Message.room == room)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = list(reversed(result.scalars().all()))
        history = []
        for m in messages:
            role = "user" if m.sender_type == "user" else "assistant"
            history.append({"role": role, "content": m.text})
        return history


async def _butler_reply(room: str, user_message: str):
    """Дворецкий отвечает через LLM"""
    # Отправляем индикатор «печатает...»
    await manager.broadcast(room, {
        "type": "typing",
        "sender_name": "Дворецкий",
        "sender_type": "butler",
    })

    # Получаем историю для контекста
    history = await _get_conversation_history(room)

    # LLM-ответ
    reply_text = await get_llm_reply(
        user_message=user_message,
        conversation_history=history,
    )

    # Сохраняем ответ Дворецкого в БД
    async with async_session() as db:
        butler_msg = Message(
            room=room,
            sender_type="butler",
            sender_name="Дворецкий",
            text=reply_text,
        )
        db.add(butler_msg)
        await db.commit()
        await db.refresh(butler_msg)

        msg_data = {
            "type": "message",
            "id": butler_msg.id,
            "room": room,
            "sender_type": "butler",
            "sender_name": "Дворецкий",
            "text": reply_text,
            "created_at": butler_msg.created_at.isoformat(),
        }

    await manager.broadcast(room, {
        "type": "typing_stop",
        "sender_name": "Дворецкий",
    })

    await manager.broadcast(room, msg_data)


async def _agent_reply(room: str, agent: Agent, user_message: str):
    """Агент отвечает через LLM с учётом персонажа (манеры, знания, промпт)"""
    # Отправляем индикатор «печатает...»
    await manager.broadcast(room, {
        "type": "typing",
        "sender_name": agent.name,
        "sender_type": "agent",
    })

    # Получаем историю для контекста
    history = await _get_conversation_history(room)

    # LLM-ответ с полным персонажем агента
    reply_text = await get_agent_reply(
        agent_name=agent.name,
        agent_profession=agent.profession,
        agent_description=agent.description or "",
        system_prompt=agent.system_prompt,
        llm_model=agent.llm_model or "gpt-4o-mini",
        user_message=user_message,
        conversation_history=history,
        # Манеры
        manner_style=agent.manner_style or "friendly",
        manner_temperament=agent.manner_temperament or "balanced",
        manner_humor=agent.manner_humor if agent.manner_humor is not None else True,
        manner_emoji_use=agent.manner_emoji_use if agent.manner_emoji_use is not None else True,
        # Знания
        knowledge_text=agent.knowledge_text,
    )

    # Сохраняем ответ агента в БД
    async with async_session() as db:
        agent_msg = Message(
            room=room,
            sender_type="agent",
            sender_agent_id=agent.id,
            sender_name=agent.name,
            text=reply_text,
        )
        db.add(agent_msg)
        await db.commit()
        await db.refresh(agent_msg)

        msg_data = {
            "type": "message",
            "id": agent_msg.id,
            "room": room,
            "sender_type": "agent",
            "sender_agent_id": agent.id,
            "sender_name": agent.name,
            "text": reply_text,
            "created_at": agent_msg.created_at.isoformat(),
            "agent_color": agent.color,
        }

    await manager.broadcast(room, {
        "type": "typing_stop",
        "sender_name": agent.name,
    })

    await manager.broadcast(room, msg_data)


@router.websocket("/ws/chat/{room}")
async def chat_websocket(websocket: WebSocket, room: str):
    """
    WebSocket для реалтайм чата с LLM-ответами.
    Клиент подключается с токеном в query: ?token=xxx

    Комнаты:
    - "general" → Дворецкий отвечает
    - "agent-{id}" → конкретный агент отвечает через get_agent_reply()
    """
    token = websocket.query_params.get("token", "")
    user_id = decode_access_token(token)

    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Получаем пользователя
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return
        user_name = user.display_name

    # Если комната агента — загружаем агента
    agent_id = _parse_agent_room(room)
    agent: Optional[Agent] = None
    if agent_id:
        agent = await _load_agent(agent_id)
        if not agent:
            await websocket.close(code=4004, reason="Agent not found")
            return

    await manager.connect(websocket, room, user_id)

    # Оповещаем комнату о подключении
    join_data = {
        "type": "user_joined",
        "user_id": user_id,
        "user_name": user_name,
        "online_users": manager.get_online_users(room),
    }
    # Для комнаты агента — передаём инфо об агенте
    if agent:
        join_data["agent_info"] = {
            "id": agent.id,
            "name": agent.name,
            "profession": agent.profession,
            "brand": agent.brand,
            "color": agent.color,
            "greeting": agent.greeting,
        }
    await manager.broadcast(room, join_data)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            text = payload.get("text", "").strip()

            if not text:
                continue

            # Сохраняем в БД
            async with async_session() as db:
                msg = Message(
                    room=room,
                    sender_type="user",
                    sender_user_id=user_id,
                    sender_name=user_name,
                    text=text,
                )
                db.add(msg)
                await db.commit()
                await db.refresh(msg)

                msg_data = {
                    "type": "message",
                    "id": msg.id,
                    "room": room,
                    "sender_type": "user",
                    "sender_user_id": user_id,
                    "sender_name": user_name,
                    "text": text,
                    "created_at": msg.created_at.isoformat(),
                }

            # Рассылаем всем в комнате
            await manager.broadcast(room, msg_data)

            # Кто отвечает?
            if agent:
                # Комната агента — агент отвечает через get_agent_reply()
                asyncio.create_task(_agent_reply(room, agent, text))
            elif room == "general":
                # Общая комната — Дворецкий отвечает
                asyncio.create_task(_butler_reply(room, text))

    except WebSocketDisconnect:
        manager.disconnect(room, user_id)
        await manager.broadcast(room, {
            "type": "user_left",
            "user_id": user_id,
            "user_name": user_name,
            "online_users": manager.get_online_users(room),
        })
    except Exception as e:
        print(f"[ws] Error: {e}")
        manager.disconnect(room, user_id)
