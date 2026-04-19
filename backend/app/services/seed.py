"""Начальное заполнение БД — системные и демо-агенты"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent

SEED_AGENTS = [
    {
        "name": "Дворецкий",
        "profession": "Ассистент",
        "brand": "Aimigo",
        "description": "Ваш персональный помощник. Всегда рядом, всё знаю о сервисе.",
        "color": "#FFD700",
        "agent_type": "system",
        "aimigo_link": "butler",
        "rating": 5.0,
    },
    {
        "name": "Новости СПб",
        "profession": "Информатор",
        "brand": "Aimigo",
        "description": "Оперативные новости города: пробки, погода, МЧС, события.",
        "color": "#2196F3",
        "agent_type": "system",
        "aimigo_link": "news-spb",
        "rating": 4.8,
    },
    {
        "name": "Макс",
        "profession": "Юрист",
        "brand": "Aimigo",
        "description": "Юрист-консультант по ПДД. Объясню штрафы, права и обязанности водителя.",
        "color": "#FF9800",
        "agent_type": "system",
        "aimigo_link": "max-pdd",
        "rating": 4.6,
    },
    {
        "name": "Доктор Вера",
        "profession": "Психолог",
        "brand": "Aimigo",
        "description": "Психолог-консультант. Поговорим о том, что беспокоит. Помогу справиться со стрессом.",
        "color": "#9C27B0",
        "agent_type": "system",
        "aimigo_link": "vera-psy",
        "rating": 4.9,
    },
    {
        "name": "Почтальон",
        "profession": "Ассистент",
        "brand": "Aimigo",
        "description": "Агент-почтальон. Проверю почту, уведомлю о важных письмах.",
        "color": "#CDDC39",
        "agent_type": "system",
        "aimigo_link": "postman",
        "rating": 4.7,
    },
    {
        "name": "Тим",
        "profession": "Консультант",
        "brand": "Adidas",
        "description": "Эксперт по спортивной одежде и обуви Adidas. Подберу размер, расскажу о новинках.",
        "color": "#4CAF50",
        "agent_type": "business",
        "aimigo_link": "tim-adidas",
        "rating": 4.7,
    },
    {
        "name": "Алиса",
        "profession": "Продавец",
        "brand": "Zara",
        "description": "Стилист-консультант Zara. Помогу собрать образ, подскажу что сейчас в тренде.",
        "color": "#E91E63",
        "agent_type": "business",
        "aimigo_link": "alisa-zara",
        "rating": 4.5,
    },
    {
        "name": "Лена",
        "profession": "Стилист",
        "brand": "H&M",
        "description": "Стилист H&M. Помогу подобрать гардероб на любой бюджет.",
        "color": "#F44336",
        "agent_type": "business",
        "aimigo_link": "lena-hm",
        "rating": 4.3,
    },
    {
        "name": "Артём",
        "profession": "Тренер",
        "brand": "FitLife",
        "description": "Персональный фитнес-тренер. Составлю программу тренировок и питания.",
        "color": "#00BCD4",
        "agent_type": "business",
        "aimigo_link": "artem-fitlife",
        "rating": 4.4,
    },
    {
        "name": "София",
        "profession": "Аналитик",
        "brand": "DataPro",
        "description": "Бизнес-аналитик. Помогу разобраться с данными, построю отчёты.",
        "color": "#607D8B",
        "agent_type": "business",
        "aimigo_link": "sofia-datapro",
        "rating": 4.2,
    },
    {
        "name": "Игорь",
        "profession": "Консультант",
        "brand": "Nike",
        "description": "Консультант Nike. Кроссовки, экипировка, лимитированные коллекции.",
        "color": "#FF5722",
        "agent_type": "business",
        "aimigo_link": "igor-nike",
        "rating": 4.5,
    },
    {
        "name": "Мария",
        "profession": "Лектор",
        "brand": "EduTech",
        "description": "Лектор по программированию. Python, JavaScript, Data Science — понятно и по делу.",
        "color": "#3F51B5",
        "agent_type": "business",
        "aimigo_link": "maria-edutech",
        "rating": 4.8,
    },
    {
        "name": "Борис",
        "profession": "Собеседник",
        "brand": "Aimigo",
        "description": "Просто хороший собеседник. Поговорим о жизни, книгах, кино.",
        "color": "#795548",
        "agent_type": "citizen",
        "aimigo_link": "boris",
        "rating": 4.0,
    },
    {
        "name": "Олег",
        "profession": "Собеседник",
        "brand": "Aimigo",
        "description": "Разбираюсь в музыке, путешествиях, гастрономии. Давай поболтаем!",
        "color": "#8BC34A",
        "agent_type": "citizen",
        "aimigo_link": "oleg",
        "rating": 3.9,
    },
]


async def seed_agents(db: AsyncSession):
    """Заполняет БД начальными агентами если таблица пустая"""
    result = await db.execute(select(Agent).limit(1))
    if result.scalar_one_or_none():
        return  # Уже есть данные

    for data in SEED_AGENTS:
        agent = Agent(**data)
        db.add(agent)

    await db.commit()
    print(f"[seed] Добавлено {len(SEED_AGENTS)} агентов")
