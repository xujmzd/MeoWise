# test_db.py
from sqlalchemy import text
from backend.database import SessionLocal

def test_db():
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1")).scalar()
        print("✅ 数据库连接成功, 返回:", result)
    except Exception as e:
        print("❌ 数据库连接失败:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
