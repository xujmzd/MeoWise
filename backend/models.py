from datetime import datetime, time

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Float,
    Boolean,
    Time,
)
from sqlalchemy.orm import declarative_base, relationship


Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 个人资料（可选）
    nickname = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    cats = relationship("Cat", back_populates="owner", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="owner")


class Cat(Base):
    """
    用户静态录入的猫咪信息：姓名 + 标准体重（kg）
    """

    __tablename__ = "cats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    standard_weight_kg = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="cats")


class Device(Base):
    """
    物联网喂食设备，代表一个实体硬件
    """

    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_sn = Column(String, unique=True, index=True, nullable=False)  # 设备序列号
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 当前状态（可由设备上报 / 系统缓存）
    bowl_weight_g = Column(Float, default=0)  # 当前食盆克数
    silo_remaining_pct = Column(Float, default=100)  # 粮桶余量百分比
    signal_strength = Column(Integer, default=0)  # 设备信号强度 0-100

    owner = relationship("User", back_populates="devices")
    feeding_plans = relationship(
        "FeedingPlan", back_populates="device", cascade="all, delete-orphan"
    )
    feeding_sessions = relationship(
        "FeedingSession", back_populates="device", cascade="all, delete-orphan"
    )


class FeedingPlan(Base):
    """
    定时喂食计划：每天/每周固定时间放多少克
    """

    __tablename__ = "feeding_plans"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    name = Column(String, nullable=False)
    # 每日或每周：这里只给出示例，可扩展为更复杂的规则
    is_enabled = Column(Boolean, default=True)
    time_of_day = Column(Time, nullable=False)
    days_of_week = Column(
        String, default="0,1,2,3,4,5,6"
    )  # "0,1,2..." 表示周日到周六，便于前端控制
    amount_g = Column(Float, nullable=False)  # 每次投放克数

    device = relationship("Device", back_populates="feeding_plans")


class FeedingSession(Base):
    """
    一次“进食会话”，用于做统计。
    - start_time：开始进食
    - end_time：结束进食
    - dispensed_g：本次投放克数（来自定时或手动）
    - eaten_g：实际吃掉的克数（需要结合称重算法，暂留字段）
    """

    __tablename__ = "feeding_sessions"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    dispensed_g = Column(Float, nullable=False)
    eaten_g = Column(Float, nullable=True)

    device = relationship("Device", back_populates="feeding_sessions")

