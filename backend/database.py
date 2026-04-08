from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings
import os

DATABASE_URL = settings.DATABASE_URL or os.getenv("DATABASE_URL", "sqlite:///./test.db")

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite:///./") else {}
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
