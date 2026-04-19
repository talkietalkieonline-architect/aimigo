# AIMIGO — Архитектура проекта

---

## Структура (планируемая)

```
aimigo/
├── docs/                          # Документация
│   ├── TECHNICAL_SPECIFICATION.md # Полное ТЗ
│   ├── PROGRESS.md                # Прогресс разработки
│   ├── ARCHITECTURE.md            # Этот файл
│   └── DECISIONS.md               # Ключевые решения
│
├── frontend/                      # Next.js + React + TypeScript
│   ├── src/
│   │   ├── app/                   # Страницы (Next.js App Router)
│   │   ├── components/            # React компоненты
│   │   │   ├── communicator/      # Коммуникатор (главный экран)
│   │   │   ├── chat/              # Чат (пузыри, медиа)
│   │   │   ├── panels/            # Левая и правая панели
│   │   │   ├── agents/            # Город агентов, Мои агенты
│   │   │   ├── contacts/          # Мои контакты
│   │   │   ├── settings/          # Центр Управления
│   │   │   └── auth/              # Вход, регистрация
│   │   ├── themes/                # Пресеты тем (Noir Gold, Cyberpunk...)
│   │   ├── hooks/                 # React хуки
│   │   ├── stores/                # Состояние (Zustand/Redux)
│   │   ├── services/              # API-клиент, WebSocket
│   │   └── types/                 # TypeScript типы
│   └── public/                    # Статика (иконки, шрифты)
│
├── backend/                       # FastAPI + Python
│   ├── app/
│   │   ├── api/                   # Роуты API
│   │   │   ├── auth.py            # Авторизация
│   │   │   ├── agents.py          # Агенты
│   │   │   ├── chat.py            # Чат
│   │   │   ├── rooms.py           # Комнаты
│   │   │   ├── contacts.py        # Контакты
│   │   │   ├── users.py           # Пользователи
│   │   │   └── admin.py           # Админка
│   │   ├── models/                # SQLAlchemy модели
│   │   ├── schemas/               # Pydantic схемы
│   │   ├── services/              # Бизнес-логика
│   │   ├── core/                  # Конфиг, безопасность, БД
│   │   └── websocket/             # WebSocket хэндлеры
│   ├── alembic/                   # Миграции БД
│   └── main.py                    # Точка входа
│
├── docker-compose.yml             # Docker (PostgreSQL, Redis, API, Frontend)
└── README.md
```

---

## Микросервисы (Фаза 3)

```
[Пользователь]
      ↓
  [Next.js фронтенд]  ←→  [WebSocket]
      ↓
  [API Gateway / Nginx]
      ↓
  ┌──────────────────────────┐
  │  FastAPI микросервисы:    │
  │  • Auth сервис            │
  │  • Chat сервис            │
  │  • Agents сервис          │
  │  • Voice сервис           │
  │  • Geo сервис             │
  │  • Shop сервис            │
  └──────────────────────────┘
      ↓           ↓         ↓
  [PostgreSQL] [Redis]  [S3 Storage]
```

---

*Обновляется по мере развития проекта*
