# backend/main.py
import os
import sys

# 确保从项目根目录执行 `uvicorn backend.main:app` 时，
# 模块优先从 backend 目录解析，避免被第三方同名包（如 site-packages 的 config）遮蔽
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import Base, engine
from routers import auth, cats, devices, feeding_plans, stats
from services.mqtt_client import mqtt_service
import models
import asyncio


async def _mqtt_listener_loop():
    """
    MQTT 长连接后台任务：
    - 连接失败（如 broker 不可达、DNS 解析失败）时只记录日志，不让异常抛到事件循环
    - 断开后按指数退避自动重连，避免刷屏
    """
    delay = 2
    while True:
        try:
            await mqtt_service.listen()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"[MQTT] 连接失败，{delay}s 后重试: {e}")
        await asyncio.sleep(delay)
        delay = min(delay * 2, 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_mqtt_listener_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception):
            pass


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
    app.include_router(cats.router, prefix=settings.API_V1_PREFIX)
    app.include_router(devices.router, prefix=settings.API_V1_PREFIX)
    app.include_router(feeding_plans.router, prefix=settings.API_V1_PREFIX)
    app.include_router(stats.router, prefix=settings.API_V1_PREFIX)

    Base.metadata.create_all(bind=engine)

    return app


# Vercel Serverless Function 入口
app = create_app()


# 本地开发入口
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
