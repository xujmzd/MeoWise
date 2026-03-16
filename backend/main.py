# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import init_db
from backend.routers import auth, users, cats, devices, feedings, stats

def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)

    # CORS 配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 开发阶段允许所有来源
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 路由
    app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
    app.include_router(users.router, prefix=settings.API_V1_PREFIX)
    app.include_router(cats.router, prefix=settings.API_V1_PREFIX)
    app.include_router(devices.router, prefix=settings.API_V1_PREFIX)
    app.include_router(feedings.router, prefix=settings.API_V1_PREFIX)
    app.include_router(stats.router, prefix=settings.API_V1_PREFIX)

    @app.on_event("startup")
    def on_startup() -> None:
        # 同步初始化表结构
        init_db()

    return app

app = create_app()
