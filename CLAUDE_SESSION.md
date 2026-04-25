# AIMIGO — Инструкция для новой сессии Claude

## Как начать сессию

Пользователь напишет: **"Продолжаем Aimigo"**

После этого Claude должен:
1. Прочитать **этот файл** — сервер, архитектура, правила
2. Прочитать **систему документации** (см. ниже)
3. Подключиться к серверу и проверить статус
4. Сам решить что делать дальше и делать

---

## Система документации (ЧИТАТЬ ВСЕ!)

| Файл | Что содержит | Когда читать |
|------|-----------------|----------------|
| `CLAUDE_SESSION.md` | Этот файл. Сервер, SSH, схема работы | **ВСЕГДА первым** |
| `docs/PROGRESS.md` | Полная история: все сессии, что сделано, что дальше | **ВСЕГДА вторым** |
| `docs/TECHNICAL_SPECIFICATION.md` | Полное ТЗ на 20 разделов (505 строк) | При работе над новыми фичами |
| `docs/BUSINESS_VISION.md` | Монетизация, аудитория, коммерческий блок | При работе над бизнес-функциями |
| `docs/ARCHITECTURE.md` | Структура проекта, микросервисы (план) | При рефакторинге |
| `docs/DECISIONS.md` | 18 ключевых решений (почему так, а не иначе) | Перед изменением архитектуры |
| `docs/DEPLOY.md` | Инструкция по деплою, бэкапы, FAQ | При работе с сервером |

**При каждой новой сессии обязательно читать CLAUDE_SESSION.md + PROGRESS.md.**
Остальные — по необходимости, но **они существуют и актуальны**.

---

## Сервер

- **IP:** 194.67.101.9
- **SSH:** root / EEP9aT7WXfGyh1XO
- **Проект:** /root/aimigo/
- **Сайт:** http://194.67.101.9:3080 (пока без домена/SSL)
- **Домен (будущий):** aimigo.online

### Подключение к серверу

Через `expect` (т.к. sshpass не установлен на Mac):

```bash
expect -c "
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@194.67.101.9
expect \"password:\"
send \"EEP9aT7WXfGyh1XO\r\"
expect \"# \"
send \"КОМАНДА\r\"
expect \"# \"
send \"exit\r\"
expect eof
"
```

**ВАЖНО:** expect не любит `$` в строках — используйте base64 для передачи конфигов с переменными.

### Проверка статуса

```bash
# Все контейнеры
cd /root/aimigo && docker compose -f docker-compose.prod.yml ps

# Health check
curl -s http://localhost:3080/api/health

# Логи
docker compose -f docker-compose.prod.yml logs --tail 20

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs backend --tail 30
```

### Обновление кода

```bash
cd /root/aimigo
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Рестарт одного сервиса

```bash
docker compose -f docker-compose.prod.yml up -d backend --force-recreate
```

---

## GitHub

- **Репо:** https://github.com/talkietalkieonline-architect/aimigo.git
- **Токен (в remote URL):** обновлять если протухнет — спросить у пользователя
- **Ветка:** main

### Схема работы

```
Локальный Mac (~/Aimigo/aimigo/)
  → редактирование кода
  → git commit + git push
  → На сервере: git pull + docker compose up -d --build
```

Можно также редактировать код **напрямую на сервере** через SSH, но предпочтительнее через git.

---

## Архитектура на сервере

```
Docker Compose (порт 3080):
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐  ┌───────┐
  │  Nginx   │→ │ Frontend │  │ Backend  │→ │ PG   │  │ Redis │
  │  :3080   │→ │  :3000   │  │  :8000   │→ │ :5432│  │ :6379 │
  └──────────┘  └──────────┘  └──────────┘  └──────┘  └───────┘

Также на сервере:
  - Системный nginx на :80/:443 (talkie-talkie.online — старый сайт)
  - /root/talkie-talkie-online/ — старый проект (не трогать)
```

---

## Стек

### Frontend
- Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- Standalone Docker build

### Backend
- FastAPI + async SQLAlchemy + PostgreSQL + Redis
- WebSocket чат с LLM-ответами
- Мульти-провайдер LLM: OpenAI / Gemini / Groq

### Ключевые файлы

```
frontend/src/
  app/page.tsx                    ← главная страница (коммуникатор)
  app/a/[slug]/page.tsx           ← Aimigo Links (публичные)
  app/admin/page.tsx              ← админка
  services/api.ts                 ← API клиент + WebSocket
  hooks/useChat.ts                ← чат хук (WS + offline)
  hooks/useAgents.ts              ← агенты из API
  context/AuthContext.tsx          ← авторизация
  components/communicator/*.tsx    ← UI компоненты

backend/
  main.py                         ← FastAPI app
  app/core/config.py              ← настройки
  app/api/auth.py                 ← SMS авторизация
  app/api/agents.py               ← CRUD агентов
  app/api/chat.py                 ← история чата
  app/api/admin.py                ← админ API
  app/websocket/chat_ws.py        ← WebSocket + LLM
  app/services/llm.py             ← LLM мульти-провайдер
  app/services/seed.py            ← начальные данные
  app/models/                     ← SQLAlchemy модели

docker-compose.prod.yml           ← production compose
nginx/                            ← nginx конфиги
docs/PROGRESS.md                  ← ПОЛНАЯ история проекта
```

---

## Текущее состояние (после Сессии 10)

### Работает:
- Фронтенд + бэкенд на http://194.67.101.9:3080
- SMS-авторизация (debug: код автоподставляется)
- Чат с Дворецким (fallback-ответы, LLM-ключ не подключен)
- WebSocket реалтайм
- 14 агентов в БД (seed)
- Город Агентов, Мои Агенты, Контакты
- Админка /admin (для номера +79214787478)
- Aimigo Links /a/[slug]

### НЕ работает (нужно сделать):
- LLM-ответы (нет ключа Gemini/OpenAI/Groq)
- Домен aimigo.online (не привязан к серверу)
- SSL/HTTPS (нет домена → нет сертификата)
- Микрофон (требует HTTPS)
- Реальные SMS (сейчас debug-режим)

---

## Правила

1. **Не спрашивай что делать** — сам решай приоритеты как CTO
2. **Проверяй build** перед пушем: `cd aimigo/frontend && npm run build`
3. **Коммить часто** с понятными сообщениями
4. **После пуша** — обновляй на сервере: git pull + docker compose up
5. **Обновляй документацию** в конце каждой сессии:
   - `docs/PROGRESS.md` — всегда (что сделано, что дальше)
   - `docs/DECISIONS.md` — если приняты новые архитектурные решения
   - `docs/ARCHITECTURE.md` — если менялась структура
   - `CLAUDE_SESSION.md` — если менялся сервер, доступы, схема работы
