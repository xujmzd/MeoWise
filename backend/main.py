# backend/main.py
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routers import auth, cats, devices, feeding_plans, stats
from backend.services.mqtt_client import mqtt_service


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
    app.include_router(cats.router, prefix=settings.API_V1_PREFIX)
    app.include_router(devices.router, prefix=settings.API_V1_PREFIX)
    app.include_router(feeding_plans.router, prefix=settings.API_V1_PREFIX)
    print("feeding_plans router included")

    app.include_router(stats.router, prefix=settings.API_V1_PREFIX)

    @app.on_event("startup")
    def on_startup() -> None:
        asyncio.create_task(mqtt_service.listen())

    return app

app = create_app()
