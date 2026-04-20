"""
LLM Service — центральный модуль для взаимодействия с языковыми моделями.
Поддерживает OpenAI (GPT), с возможностью расширения на Claude, Gemini и т.д.
"""
import json
from typing import Optional

import httpx

from app.core.config import settings

# Системный промпт Дворецкого (по умолчанию)
BUTLER_SYSTEM_PROMPT = """Ты — Дворецкий, персональный AI-помощник платформы Aimigo.
Aimigo — это AI-first коммуникационная платформа, где пользователи общаются с AI-агентами голосом и текстом.

Твои задачи:
- Помогать пользователю ориентироваться на платформе
- Отвечать на вопросы о сервисе, агентах, комнатах
- Вести приятную беседу на любые темы
- Подсказывать подходящих агентов из Города Агентов
- Быть вежливым, лаконичным и полезным

Ты говоришь по-русски. Ответы давай кратко — 1-3 предложения, если не просят подробнее.
Будь дружелюбным, но профессиональным. Используй эмодзи умеренно."""

# Fallback ответы (когда LLM недоступен)
FALLBACK_REPLIES = [
    "Отличный вопрос! К сожалению, я сейчас работаю в ограниченном режиме. Попробуйте позже.",
    "Я рядом, но мои AI-мощности временно ограничены. Скоро вернусь в полную силу!",
    "Записал ваш вопрос. Отвечу, как только восстановлю подключение к AI.",
]


async def get_llm_reply(
    user_message: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    conversation_history: Optional[list] = None,
) -> str:
    """
    Получить ответ от LLM.
    
    Args:
        user_message: Сообщение пользователя
        system_prompt: Системный промпт (None = Дворецкий по умолчанию)
        model: Модель LLM (None = из настроек)
        conversation_history: История диалога [{role, content}, ...]
    
    Returns:
        Текст ответа от LLM
    """
    if not settings.OPENAI_API_KEY:
        # LLM не настроен — fallback
        import random
        return random.choice(FALLBACK_REPLIES)

    prompt = system_prompt or BUTLER_SYSTEM_PROMPT
    llm_model = model or settings.OPENAI_MODEL

    # Собираем сообщения
    messages = [{"role": "system", "content": prompt}]

    # Добавляем историю диалога (последние 10 сообщений для контекста)
    if conversation_history:
        messages.extend(conversation_history[-10:])

    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": llm_model,
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
            )

            if response.status_code != 200:
                print(f"[llm] OpenAI error: {response.status_code} {response.text[:200]}")
                import random
                return random.choice(FALLBACK_REPLIES)

            data = response.json()
            reply = data["choices"][0]["message"]["content"].strip()
            return reply

    except Exception as e:
        print(f"[llm] Error: {e}")
        import random
        return random.choice(FALLBACK_REPLIES)


async def get_agent_reply(
    agent_name: str,
    agent_profession: str,
    agent_description: str,
    system_prompt: Optional[str],
    llm_model: str,
    user_message: str,
    conversation_history: Optional[list] = None,
) -> str:
    """
    Получить ответ от конкретного агента.
    Если у агента нет своего system_prompt — генерируем из его данных.
    """
    if system_prompt:
        prompt = system_prompt
    else:
        prompt = f"""Ты — {agent_name}, {agent_profession}.
{agent_description}

Отвечай от имени {agent_name}. Будь профессиональным и полезным.
Ответы давай кратко — 1-3 предложения. Говори по-русски."""

    return await get_llm_reply(
        user_message=user_message,
        system_prompt=prompt,
        model=llm_model,
        conversation_history=conversation_history,
    )
