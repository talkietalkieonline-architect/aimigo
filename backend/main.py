"""Aimigo — FastAPI Backend"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, async_session
from app.api.auth import router as auth_router
from app.api.agents import router as agents_router
from app.api.chat import router as chat_router
from app.api.users import router as users_router
from app.api.admin import router as admin_router
from app.websocket.chat_ws import router as ws_router
from app.services.seed import seed_agents


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / Shutdown"""
    # Создаём таблицы (для dev; в prod — alembic)
    async with engine.begin() as conn:
        # Импортируем модели чтобы Base их увидел
        import app.models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

    # Заполняем начальными данными
    async with async_session() as db:
        await seed_agents(db)

    print(f"[aimigo] Сервер запущен — {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    print("[aimigo] Сервер остановлен")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(chat_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(ws_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "aimigo", "version": settings.APP_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
