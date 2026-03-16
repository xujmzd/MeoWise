# from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import text
#
# from backend.config import settings
# from backend.models import Base
#
# # 使用异步引擎（注意 DATABASE_URL 要改成 async 版本，比如 "postgresql+asyncpg://user:pass@localhost/dbname"）
# engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)
#
# # 创建异步 Session
# AsyncSessionLocal = sessionmaker(
#     bind=engine,
#     class_=AsyncSession,
#     expire_on_commit=False,
#     autoflush=False,
#     autocommit=False,
# )
#
# async def init_db() -> None:
#     """
#     异步初始化数据库（开发环境用，生产建议使用 Alembic 迁移）
#     """
#     async with engine.begin() as conn:
#         # 创建所有模型对应的表
#         await conn.run_sync(Base.metadata.create_all)
#
# async def get_db():
#     async with AsyncSessionLocal() as session:
#         yield session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./test.db"  # 或者你的 Postgres/MySQL URL

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}  # SQLite 特有参数
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
def init_db() -> None:
    """
    初始化数据库（开发环境用，生产建议使用 Alembic 迁移）
    """
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
