"""WebSocket эндпоинт для чата с LLM-ответами"""
import asyncio
import json
from datetime import datetime, timezone

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


@router.websocket("/ws/chat/{room}")
async def chat_websocket(websocket: WebSocket, room: str):
    """
    WebSocket для реалтайм чата с LLM-ответами.
    Клиент подключается с токеном в query: ?token=xxx
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

    await manager.connect(websocket, room, user_id)

    # Оповещаем комнату о подключении
    await manager.broadcast(room, {
        "type": "user_joined",
        "user_id": user_id,
        "user_name": user_name,
        "online_users": manager.get_online_users(room),
    })

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

            # Дворецкий отвечает через LLM (асинхронно, не блокирует приём сообщений)
            # В комнате "general" Дворецкий всегда отвечает
            if room == "general":
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
