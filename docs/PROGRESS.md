# AIMIGO — Прогресс разработки

---

## Текущий статус: MVP — UI КОММУНИКАТОРА

### Сессия 1 (Июнь 2025)
- [x] Обсуждение концепции и функционала
- [x] Составлено полное ТЗ (TECHNICAL_SPECIFICATION.md)
- [x] Изучен старый проект Talkie-Talkie Online (GitHub)
- [x] Определён технологический стек
- [x] Создание структуры проекта
- [x] Инициализация Next.js (frontend)
- [x] Инициализация FastAPI (backend)
- [x] Базовый UI Коммуникатора — РАБОТАЕТ!
- [x] GitHub репозиторий подключён
- [x] Автозакрытие панелей (4 сек)
- [x] Центр Управления + переключение тем (5 пресетов)
- [x] Заставка + Экран входа (телефон/SMS/пароль)
- [x] Мои агенты (модалка с группами + меню агента)
- [x] Всё запушено в GitHub

### Что сделано
1. Полное ТЗ на 20 разделов (505 строк)
2. Система документации (4 файла)
3. Next.js + TypeScript + Tailwind — инициализирован
4. FastAPI backend — инициализирован
5. Система тем — 5 пресетов (Noir Gold, Cyberpunk, Arctic, Midnight, Sunset)
6. UI Коммуникатора:
   - Фоновые частицы (анимация)
   - Верхняя панель (лого AIMIGO + бегущая строка ЭФИР)
   - Центральный чат (пузыри, аватары, демо-сообщения)
   - Нижняя панель (5 кнопок)
   - Левая панель (Режимы + Комнаты) — выдвижная
   - Правая панель (Дворецкий + Участники) — выдвижная
   - Золотые язычки по бокам

### Сессия 2 (Июнь 2025)
- [x] Рабочий чат — поле ввода, отправка сообщений, автоответы Дворецкого, индикатор «печатает...», анимация появления сообщений
- [x] Город Агентов — полноценный каталог с 14 агентами, поиск, фильтры по профессии и типу, счётчики, меню агента с действиями, добавление/удаление из избранного
- [x] Мои Контакты — список контактов, онлайн/офлайн статус, Aimigo Link, меню контакта, добавление по ссылке
- [x] Связь Мои Агенты → Город Агентов (переход по кнопке)
- [x] CSS-анимации: fade-in сообщений, typing dots, marquee (ЭФИР)

### Сессия 3 (Июнь 2025)
- [x] FastAPI + PostgreSQL (async SQLAlchemy, auto-create tables)
- [x] Модели БД: User, Agent, Message
- [x] API авторизации: send-sms, verify-sms, set-password, login (JWT, bcrypt)
- [x] API агентов: каталог с поиском, фильтрами, счётчиками
- [x] API чата: история + отправка сообщений
- [x] API пользователя: профиль, обновление настроек
- [x] WebSocket чат по комнатам (ConnectionManager + JWT аутентификация)
- [x] Seed-скрипт: 14 начальных агентов (системные + бизнес + жители)
- [x] Фикс размера чата — поле ввода перенесено в BottomBar

### API Эндпоинты (16 роутов)
- `POST /api/auth/send-sms` — отправка SMS-кода
- `POST /api/auth/verify-sms` — проверка кода
- `POST /api/auth/set-password` — установка пароля (регистрация)
- `POST /api/auth/login` — вход (телефон + пароль)
- `GET /api/agents` — каталог агентов
- `GET /api/agents/{id}` — карточка агента
- `GET /api/chat/history` — история сообщений
- `POST /api/chat/send` — отправка сообщения
- `GET /api/users/me` — профиль
- `PATCH /api/users/me` — обновление настроек
- `WS /ws/chat/{room}` — реалтайм чат
- `GET /api/health` — здоровье сервиса

### Сессия 4 (Июнь 2025)
- [x] Авторизация переделана: только SMS (без пароля)
  - 🇷🇺 Флаг + зашитый +7, курсор сразу на первой цифре
  - Маска ввода: (___) ___-__-__ — только цифры
  - Номер сохраняется в localStorage, подтягивается при повторном входе
  - SMS-код автоподставляется (MVP)
  - Таймер повторной отправки 60 сек
- [x] Сохранение сессии 30 дней (как ChatGPT — не просит логин повторно)
- [x] UI фиксы:
  - Аватарки Дворецкого (CSS var + hex не работал — заменено на rgba)
  - Бегущая строка ЭФИР (padding-left:100% для плавного входа)
  - Фон TopBar (bar-bg)
  - Убран Next.js dev indicator (N)
- [x] Чат переделан:
  - Сообщения прижаты к низу (как Telegram)
  - Отступы 52px от краёв — панели не наезжают на текст
  - Пузыри: агенты СЛЕВА, пользователь СПРАВА
  - Хвостики пузырей (borderRadius разный)
  - max-width 70%
- [x] Панели уже (w-44) — не перекрывают чат
- [x] Прикрепление медиа (скрепка 📎) — фото/видео в чате
- [x] Голосовые дорожки (VoiceWave) — волновая анимация + play через Web Speech API
- [x] Динамический размер чата — TopBar/BottomBar сообщают высоту через ResizeObserver

### Сессия 5 (Июнь 2025)
- [x] Пузыри перевёрнуты: пользователь СЛЕВА, агенты СПРАВА
- [x] Чат отцентрован (max-width 620px, flex justify-center)
- [x] Крылышки (язычки) — всегда видны, сдвигаются к краю панели, стрелка меняется
- [x] Панели ПОВЕРХ строки ЭФИР (z-index иерархия)
- [x] Панели шире: w-44 → w-48 (192px)
- [x] Поле ввода отцентровано (600px)
- [x] Отступ пузырей от BottomBar (+16px + pb-6)
- [x] Кнопка прослушивания пузыря (динамик) + кнопка "показать как голосовое"
- [x] VoiceBubble в стиле Telegram (play/pause, волновая дорожка, прогресс, таймер)
- [x] Адаптив под мобильные (media queries + safe area)
- [x] Документация бизнес-концепции (BUSINESS_VISION.md)
- [x] Переключатель ввода: кнопка «Текст ⌨️» вместо Mute, поле ввода скрыто по умолчанию (voice-first)
- [x] Микрофон 4 состояния: OFF / ON / ALWAYS-ON (пульсация) / MUTE (красный)
  - Короткое нажатие: вкл/выкл
  - Длинное нажатие (600ms): always-on / mute
  - Подсказка состояния под кнопками
- [x] Кнопка «+» для медиа в голосовом режиме (Фото / Видео / Файл / Ссылка)
- [x] Пузыри: 2 кнопки (прослушать + голосовое ↔ Aа текст)
- [x] Контекстное меню пузыря: long press (мобиле) / right click (десктоп)
  - Копировать текст
  - Сохранить медиа (фото/видео)

### Сессия 6 (Июнь 2025)
- [x] **AuthContext** — единый React-контекст авторизации (AuthProvider)
  - Проверка сессии при загрузке (localStorage + API /users/me)
  - login() / logout() функции
  - Флаг isOnline (бэкенд доступен / нет)
  - Graceful fallback на offline-режим
- [x] **useChat хук** — реалтайм чат через WebSocket
  - Подключение к WS /ws/chat/{room} с JWT-токеном
  - Загрузка истории из API /chat/history
  - Автопереподключение через 3 сек
  - Offline fallback: локальные ответы Дворецкого (как раньше)
  - Индикатор isConnected (online badge)
- [x] **useAgents хук** — агенты из API
  - Загрузка из GET /api/agents с поиском/фильтрами
  - Fallback на 14 хардкод-агентов если API недоступен
  - Счётчики: total, business, citizen, system
- [x] **LoginScreen → API** — реальная авторизация
  - send-sms → verify-sms → JWT токен
  - При успехе — сохранение в AuthContext
  - Fallback на локальный режим (как раньше)
- [x] **AgentCityModal → API** — каталог из бэкенда
  - Убран хардкод CITY_AGENTS (170 строк)
  - Использует useAgents хук
  - Синхронизированы типы AgentOut (фронт ↔ бэкенд)
- [x] **page.tsx рефакторинг** — убраны inline данные
  - Убраны BUTLER_REPLIES, INITIAL_MESSAGES, hasValidSession
  - Использует useAuth + useChat
  - Индикатор «online» при подключении к серверу
- [x] **api.ts** — синхронизация типов
  - AgentOut: color (не avatar_color), rating_count, aimigo_link
  - Убраны несуществующие поля (greeting, avatar_emoji, is_active)
- [x] **Docker Compose** — добавлен Redis
  - redis:7-alpine с healthcheck
  - REDIS_URL в env бэкенда
  - depends_on: postgres + redis
- [x] **Build проходит чисто** (TypeScript + Next.js production build)

### Архитектура после Сессии 6
```
frontend/src/
  context/AuthContext.tsx     ← NEW: единый контекст авторизации
  hooks/useChat.ts            ← NEW: WebSocket чат + offline fallback
  hooks/useAgents.ts          ← NEW: агенты из API + fallback
  services/api.ts             ← UPDATED: синхронизированы типы
  app/page.tsx                ← UPDATED: useAuth + useChat
  app/layout.tsx              ← UPDATED: AuthProvider
  components/auth/LoginScreen ← UPDATED: API авторизация
  components/communicator/AgentCityModal ← UPDATED: useAgents
```

### Сессия 7 (Июнь 2025)
- [x] **Коммерческий блок** — кнопка «Для бизнеса» в Городе Агентов
- [x] **ЛК Бизнеса** (BusinessDashboardModal) — список своих агентов, статистика, удаление
- [x] **Конструктор Агента** (AgentConstructorModal) — 3 шага:
  - Шаг 1: Имя, профессия, бренд, цвет аватара (14 пресетов)
  - Шаг 2: Описание + приветственное сообщение
  - Шаг 3: AI-модель (GPT-4o Mini/GPT-4o) + системный промпт + превью
- [x] **Backend API конструктора:**
  - `POST /api/agents` — создание агента с owner_id
  - `GET /api/agents/my` — мои агенты
  - `PATCH /api/agents/{id}` — редактирование (только владелец)
  - `DELETE /api/agents/{id}` — мягкое удаление (только владелец)
- [x] **Модель Agent расширена:**
  - `owner_id` (FK на users)
  - `system_prompt` (инструкция для LLM)
  - `llm_model` (gpt-4o-mini / gpt-4o)
  - `greeting` (приветствие)
- [x] **LLM Service** (app/services/llm.py):
  - OpenAI GPT через httpx (async)
  - Системный промпт Дворецкого
  - Контекст диалога (10 последних сообщений)
  - Fallback-ответы если API недоступен
  - Функция `get_agent_reply()` для конкретных агентов
- [x] **WebSocket чат + LLM:**
  - Дворецкий отвечает через GPT (асинхронно, не блокирует WS)
  - Индикатор «печатает...» (typing/typing_stop события)
  - История для контекста LLM
  - Ответы сохраняются в БД
- [x] **Голосовой ввод** (Web Speech API):
  - Распознавание речи на русском (ru-RU)
  - Индикатор распознавания (текст под кнопками)
  - Автоотправка при паузе
  - Режим always-on: перезапуск после каждой фразы
  - Короткое нажатие микрофона: вкл/выкл распознавание
  - Длинное нажатие: always-on / mute
- [x] **Типы Speech API** (speech.d.ts) — полные TypeScript-декларации
- [x] **Build проходит чисто** (TypeScript + Next.js)

### API Эндпоинты после Сессии 7 (20 роутов)
- `POST /api/auth/send-sms` — отправка SMS-кода
- `POST /api/auth/verify-sms` — проверка кода → JWT
- `GET /api/agents` — каталог агентов
- `GET /api/agents/my` — мои агенты (**NEW**)
- `GET /api/agents/{id}` — карточка агента
- `POST /api/agents` — создать агента (**NEW**)
- `PATCH /api/agents/{id}` — редактировать агента (**NEW**)
- `DELETE /api/agents/{id}` — удалить агента (**NEW**)
- `GET /api/chat/history` — история сообщений
- `POST /api/chat/send` — отправка сообщения
- `GET /api/users/me` — профиль
- `PATCH /api/users/me` — обновление настроек
- `WS /ws/chat/{room}` — реалтайм чат + **LLM-ответы**
- `GET /api/health` — здоровье сервиса

### Архитектура после Сессии 7
```
frontend/src/
  types/speech.d.ts                  ← NEW: Web Speech API типы
  services/api.ts                    ← UPDATED: CRUD агентов
  hooks/useChat.ts                   ← UPDATED: typing/typing_stop от сервера
  app/page.tsx                       ← UPDATED: Business + Constructor модалки
  components/communicator/
    AgentCityModal.tsx               ← UPDATED: кнопка «Для бизнеса»
    BusinessDashboardModal.tsx       ← NEW: ЛК Бизнеса
    AgentConstructorModal.tsx        ← NEW: Конструктор (3 шага)
    BottomBar.tsx                    ← UPDATED: Web Speech API голосовой ввод

backend/app/
  models/agent.py                    ← UPDATED: owner_id, system_prompt, llm_model, greeting
  schemas/agent.py                   ← UPDATED: AgentCreate, AgentUpdate
  api/agents.py                      ← UPDATED: CRUD + /my
  services/llm.py                    ← NEW: LLM Service (OpenAI GPT)
  websocket/chat_ws.py               ← UPDATED: LLM-ответы Дворецкого
  core/config.py                     ← UPDATED: OPENAI_API_KEY, OPENAI_MODEL, REDIS_URL
```

### Сессия 7.5 (Июнь 2025)
- [x] **Админка `/admin`** — полная панель управления:
  - Таблица агентов (фильтры, поиск, удалённые)
  - Создание агента (system/business/citizen) + привязка к бизнесу
  - Редактирование всех полей + промпт
  - Привязка/отвязка агента от бизнеса
  - Деактивация / восстановление / жёсткое удаление
  - Пользователи: таблица, поиск, роль/статус
  - Статистика платформы
- [x] **Разделение ролей:**
  - User.is_admin + ADMIN_PHONES в конфиге
  - get_admin_user dependency
  - Админ создаёт агентов → привязывает к бизнесу
  - Бизнес настраивает агента (не создаёт!)
- [x] **Модель персонажа агента** (заложена на масштабирование):
  - Голос: voice_id, voice_speed, voice_pitch
  - Внешность: appearance_preset/face/hair/skin/body
  - Одежда: outfit_style/top/bottom/shoes/accessory
  - Манеры: manner_style/temperament/humor/emoji_use
  - Знания: knowledge_text/urls/files
- [x] **ЛК Бизнеса перестроен:**
  - Убрано создание агентов
  - Настройка: описание, приветствие, промпт, модель
  - Плейсхолдеры: Голос, Внешность, Одежда, Манеры, Знания
- [x] **Admin API (8 новых роутов):**
  - GET/POST /api/admin/agents
  - GET/PATCH/DELETE /api/admin/agents/{id}
  - PATCH /api/admin/agents/{id}/assign
  - PATCH /api/admin/agents/{id}/restore
  - GET /api/admin/users
  - GET /api/admin/stats
- [x] Build чист

### Сессия 8 (Июнь 2025)
- [x] **ЛК Бизнеса — полный UI настройки персонажа (6 секций):**
  - Табы: AI | Манеры | Знания | Голос | Внешность | Одежда
  - AI: описание, приветствие, системный промпт, выбор модели
  - Манеры: стиль общения (4), темперамент (4), юмор ВКЛ/ВЫКЛ, эмодзи ВКЛ/ВЫКЛ
  - Знания: textarea 50 000 символов + плейсхолдеры файлов/URL
  - Голос: 5 пресетов + слайдеры скорость/тон (0.5–2.0)
  - Внешность: лицо (4), волосы (5), кожа (4), телосложение (4)
  - Одежда: стиль (4) + текстовые поля верх/низ/обувь/аксессуар
  - Сохранение всех секций разом через PATCH /api/agents/{id}
- [x] **API типы обновлены:**
  - `AgentFullOut` — 30+ полей персонажа (AI, голос, внешность, одежда, манеры, знания)
  - `AgentPersonaUpdate` — обновление всех секций
  - `getMyAgents()` → `AgentFullOut[]`
- [x] **Сценарий приветствия Дворецкого:**
  - Новый пользователь: развёрнутое приветствие + упоминание голоса
  - Возвращающийся: 5 вариантов с именем, не повторяются подряд
  - Индекс приветствия в localStorage
- [x] **Личный агент пользователя:**
  - Группа «Личные» в MyAgentsModal загружает из API (тип citizen)
  - Есть агенты — аватары с меткой «Личный»
  - Нет агентов — карточка «Создайте своего AI-агента» + кнопка «Подписаться»
- [x] **TTS автоозвучка ответов агентов:**
  - ChatArea.autoSpeak — когда микрофон активен, новые ответы озвучиваются через speechSynthesis
  - BottomBar.onMicStateChange → page.tsx → ChatArea.autoSpeak
- [x] **LLM Service — манеры + знания:**
  - `_build_agent_prompt()` — собирает промпт из манер, знаний, system_prompt
  - Маппинг стилей/темперамента на русские описания
  - База знаний вставляется в контекст (лимит 8000 симв.)
  - `get_agent_reply()` принимает все параметры персонажа
- [x] **Build чист** (TypeScript + Next.js)

### Архитектура после Сессии 8
```
frontend/src/
  services/api.ts                    ← UPDATED: AgentFullOut, AgentPersonaUpdate
  hooks/useChat.ts                   ← UPDATED: buildWelcome() умное приветствие
  app/page.tsx                       ← UPDATED: micActive + autoSpeak
  components/communicator/
    BusinessDashboardModal.tsx       ← REWRITTEN: 6 табов настройки персонажа
    ChatArea.tsx                     ← UPDATED: autoSpeak TTS
    BottomBar.tsx                    ← UPDATED: onMicStateChange
    MyAgentsModal.tsx                ← UPDATED: личные агенты из API

backend/app/
  services/llm.py                    ← UPDATED: _build_agent_prompt(), манеры+знания
```

### Что следующее (Сессия 9)

**1. Docker compose up** — проверка полной связки (PostgreSQL + Redis + Backend + Frontend)

**2. Личный чат с агентом:**
   - Нажатие на агента → личная комната чата
   - WS комната `agent-{id}` → LLM отвечает через get_agent_reply()
   - Манеры и знания агента влияют на ответы

**3. Подписка + оплата:**
   - Модель подписки в БД
   - Кнопка «Подписаться» → создание личного агента

**4. Микрофон — проверка на реальном устройстве**

**5. Деплой** — VPS / Vercel + Railway

---

## Источники
- Старый проект: `talkie-talkie-online/` (склонирован)
- Стабильная версия v0.39: коммит `8680c0c` / файл до разбиения: коммит `50aaa15`
- Оригинальный index.html (5258 строк): `git show 50aaa15:templates/index.html`

---

*Обновляется после каждой сессии работы*
