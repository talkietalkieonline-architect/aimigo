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


# Маппинг манер для промпта
_MANNER_LABELS = {
    "friendly": "дружелюбно и непринуждённо",
    "formal": "формально и профессионально",
    "playful": "игриво и с юмором",
    "strict": "строго и по делу",
}
_TEMPERAMENT_LABELS = {
    "calm": "спокойный и размеренный",
    "balanced": "сбалансированный",
    "energetic": "энергичный и эмоциональный",
    "reserved": "сдержанный и лаконичный",
}


def _build_agent_prompt(
    agent_name: str,
    agent_profession: str,
    agent_description: str,
    system_prompt: Optional[str],
    manner_style: str = "friendly",
    manner_temperament: str = "balanced",
    manner_humor: bool = True,
    manner_emoji_use: bool = True,
    knowledge_text: Optional[str] = None,
) -> str:
    """Собираем промпт агента с учётом манер, знаний и пользовательского system_prompt."""

    # База
    parts = [f"Ты — {agent_name}, {agent_profession}."]
    if agent_description:
        parts.append(agent_description)

    # Манеры
    style = _MANNER_LABELS.get(manner_style, "дружелюбно")
    temp = _TEMPERAMENT_LABELS.get(manner_temperament, "сбалансированный")
    parts.append(f"\nОбщайся {style}. Твой темперамент: {temp}.")

    if manner_humor:
        parts.append("Можно использовать юмор и шутки, если уместно.")
    else:
        parts.append("Не шути, будь серьёзным.")

    if manner_emoji_use:
        parts.append("Используй эмодзи умеренно.")
    else:
        parts.append("Не используй эмодзи.")

    # Знания
    if knowledge_text and knowledge_text.strip():
        kb = knowledge_text.strip()[:8000]  # ограничиваем
        parts.append(f"\n=== БАЗА ЗНАНИЙ ===\n{kb}\n=== КОНЕЦ БАЗЫ ЗНАНИЙ ===")
        parts.append("Отвечай на основе базы знаний. Если информации нет — честно скажи, что не знаешь.")

    # Пользовательский system_prompt (дополняет)
    if system_prompt and system_prompt.strip():
        parts.append(f"\nДополнительные инструкции:\n{system_prompt.strip()}")

    parts.append("\nОтвечай кратко — 1-3 предложения, если не просят подробнее. Говори по-русски.")

    return "\n".join(parts)


async def get_agent_reply(
    agent_name: str,
    agent_profession: str,
    agent_description: str,
    system_prompt: Optional[str],
    llm_model: str,
    user_message: str,
    conversation_history: Optional[list] = None,
    # Манеры
    manner_style: str = "friendly",
    manner_temperament: str = "balanced",
    manner_humor: bool = True,
    manner_emoji_use: bool = True,
    # Знания
    knowledge_text: Optional[str] = None,
) -> str:
    """
    Получить ответ от конкретного агента.
    Собирает промпт из манер, знаний и system_prompt.
    """
    prompt = _build_agent_prompt(
        agent_name=agent_name,
        agent_profession=agent_profession,
        agent_description=agent_description,
        system_prompt=system_prompt,
        manner_style=manner_style,
        manner_temperament=manner_temperament,
        manner_humor=manner_humor,
        manner_emoji_use=manner_emoji_use,
        knowledge_text=knowledge_text,
    )

    return await get_llm_reply(
        user_message=user_message,
        system_prompt=prompt,
        model=llm_model,
        conversation_history=conversation_history,
    )
