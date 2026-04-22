"""
LLM Service — мульти-провайдер: OpenAI, Gemini, Groq.
Автовыбор по наличию ключей.
"""
import json
import random
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


def get_active_provider() -> dict:
    """Определяем активный провайдер по наличию ключей"""
    pref = settings.DEFAULT_LLM_PROVIDER
    providers = {
        "gemini": {"key": settings.GEMINI_API_KEY, "model": settings.GEMINI_MODEL, "name": "gemini"},
        "openai": {"key": settings.OPENAI_API_KEY, "model": settings.OPENAI_MODEL, "name": "openai"},
        "groq":   {"key": settings.GROQ_API_KEY,   "model": settings.GROQ_MODEL,   "name": "groq"},
    }
    # Сначала предпочтительный
    if pref in providers and providers[pref]["key"]:
        return providers[pref]
    # Потом любой с ключом
    for p in providers.values():
        if p["key"]:
            return p
    return {"key": "", "model": "none", "name": "none"}


async def _call_openai(messages: list, model: str, api_key: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "max_tokens": 500, "temperature": 0.7},
        )
        if r.status_code != 200:
            print(f"[llm] OpenAI error: {r.status_code} {r.text[:200]}")
            return ""
        return r.json()["choices"][0]["message"]["content"].strip()


async def _call_gemini(messages: list, model: str, api_key: str) -> str:
    # Gemini использует другой формат: contents[{role, parts}]
    contents = []
    system_text = ""
    for m in messages:
        if m["role"] == "system":
            system_text = m["content"]
        else:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})
    async with httpx.AsyncClient(timeout=30.0) as client:
        body = {"contents": contents, "generationConfig": {"maxOutputTokens": 500, "temperature": 0.7}}
        if system_text:
            body["systemInstruction"] = {"parts": [{"text": system_text}]}
        r = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json=body,
        )
        if r.status_code != 200:
            print(f"[llm] Gemini error: {r.status_code} {r.text[:200]}")
            return ""
        data = r.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


async def _call_groq(messages: list, model: str, api_key: str) -> str:
    # Groq использует OpenAI-совместимый API
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "max_tokens": 500, "temperature": 0.7},
        )
        if r.status_code != 200:
            print(f"[llm] Groq error: {r.status_code} {r.text[:200]}")
            return ""
        return r.json()["choices"][0]["message"]["content"].strip()


async def get_llm_reply(
    user_message: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    conversation_history: Optional[list] = None,
) -> str:
    """Получить ответ от LLM. Автовыбор провайдера."""
    provider = get_active_provider()
    if not provider["key"]:
        return random.choice(FALLBACK_REPLIES)

    prompt = system_prompt or BUTLER_SYSTEM_PROMPT
    messages = [{"role": "system", "content": prompt}]
    if conversation_history:
        messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": user_message})

    llm_model = model or provider["model"]
    pname = provider["name"]
    # Если модель явно gemini-*/gpt-*/llama-*, определяем провайдер по имени
    if llm_model.startswith("gemini"):
        pname = "gemini"
    elif llm_model.startswith(("gpt-", "o1", "o3")):
        pname = "openai"
    elif llm_model.startswith(("llama", "mixtral")):
        pname = "groq"

    try:
        if pname == "gemini" and settings.GEMINI_API_KEY:
            reply = await _call_gemini(messages, llm_model, settings.GEMINI_API_KEY)
        elif pname == "groq" and settings.GROQ_API_KEY:
            reply = await _call_groq(messages, llm_model, settings.GROQ_API_KEY)
        elif pname == "openai" and settings.OPENAI_API_KEY:
            reply = await _call_openai(messages, llm_model, settings.OPENAI_API_KEY)
        else:
            # Fallback на любой доступный
            if settings.GEMINI_API_KEY:
                reply = await _call_gemini(messages, settings.GEMINI_MODEL, settings.GEMINI_API_KEY)
            elif settings.OPENAI_API_KEY:
                reply = await _call_openai(messages, settings.OPENAI_MODEL, settings.OPENAI_API_KEY)
            elif settings.GROQ_API_KEY:
                reply = await _call_groq(messages, settings.GROQ_MODEL, settings.GROQ_API_KEY)
            else:
                return random.choice(FALLBACK_REPLIES)
        return reply or random.choice(FALLBACK_REPLIES)
    except Exception as e:
        print(f"[llm] Error ({pname}): {e}")
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
