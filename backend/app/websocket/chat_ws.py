"""WebSocket эндпоинт для чата"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.security import decode_access_token
from app.models.message import Message
from app.models.user import User
from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/chat/{room}")
async def chat_websocket(websocket: WebSocket, room: str):
    """
    WebSocket для реалтайм чата.
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

            # Рассылаем всем в комнате (включая отправителя — для подтверждения)
            await manager.broadcast(room, msg_data)

    except WebSocketDisconnect:
        manager.disconnect(room, user_id)
        await manager.broadcast(room, {
            "type": "user_left",
            "user_id": user_id,
            "user_name": user_name,
            "online_users": manager.get_online_users(room),
        })
    except Exception:
        manager.disconnect(room, user_id)
