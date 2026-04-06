from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Float,
    Boolean,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    """
    用户表：
    - 存储用户的基本信息和认证信息
    - 一个用户可以拥有多只猫咪和多个设备
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)   # 邮箱（唯一登录标识）
    hashed_password = Column(String, nullable=False)                  # 哈希后的密码
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))            # 创建时间
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))  # 更新时间
    phone = Column(String, unique=True)                              # 手机号（唯一，用于找回密码）

    nickname = Column(String, nullable=True)                         # 昵称
    avatar_id = Column(Integer, nullable=True)                       # 用户头像 ID

    # 关系映射
    cats = relationship("Cat", back_populates="owner", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="owner")


class Cat(Base):
    """
    猫咪表：
    - 存储猫咪的基本信息
    - 每只猫咪属于一个用户
    """
    __tablename__ = "cats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)                            # 猫咪名字
    standard_weight_kg = Column(Float, nullable=False)                # 标准体重（kg）
    avatar_id = Column(Integer, nullable=True, default=None)          # 猫咪头像 ID

    user_id = Column(Integer, ForeignKey("users.id"))                 # 所属用户 ID
    owner = relationship("User", back_populates="cats")               # 反向关系：用户拥有的猫咪


class Device(Base):
    """
    设备表：
    - 存储物联网喂食设备的信息
    - 每个设备属于一个用户
    """
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_sn = Column(String, unique=True, index=True, nullable=False)  # 设备序列号（唯一）
    name = Column(String, nullable=False)                                # 设备名称
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)    # 所属用户 ID
    
    # WiFi 配置信息
    wifi_ssid = Column(String, nullable=True)                            # WiFi 名称
    wifi_password = Column(String, nullable=True)                        # WiFi 密码（加密存储）
    
    # 当前状态（由设备上报或系统缓存）
    bowl_weight_g = Column(Float, default=0)                             # 食盆重量（克）
    silo_remaining_pct = Column(Float, default=100)                      # 粮仓余量百分比
    signal_strength = Column(Integer, default=0)                         # 信号强度（0-100）
    
    # 更新时间
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))  # 更新时间

    # 关系映射
    owner = relationship("User", back_populates="devices")
    feeding_plans = relationship("FeedingPlan", back_populates="device", cascade="all, delete-orphan")
    feedings = relationship("Feeding", back_populates="device", cascade="all, delete-orphan")
    eatings = relationship("Eating", back_populates="device", cascade="all, delete-orphan")


class FeedingPlan(Base):
    """
    喂食计划表：
    - 存储定时喂食计划
    - 每个计划绑定到一个设备
    """
    __tablename__ = "feeding_plans"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)  # 关联设备 ID
    name = Column(String, nullable=False)                                  # 计划名称
    time_of_day = Column(String, nullable=False)                           # 每天的时间（如 "08:00"）
    days_of_week = Column(String, nullable=False)                          # 哪些天执行（如 "Mon,Tue,Wed"）
    amount_g = Column(Float, nullable=False)                               # 投喂克数
    is_enabled = Column(Boolean, default=True)                             # 是否启用

    device = relationship("Device", back_populates="feeding_plans")


class Feeding(Base):
    """
    喂食记录表：
    - 存储每次投喂的记录（手动或定时）
    """
    __tablename__ = "feedings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)      # 投喂用户 ID
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)  # 投喂设备 ID
    feeding_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))               # 投喂时间
    amount_g = Column(Float, nullable=False)                               # 投喂克数
    type = Column(String, nullable=False)                                  # 投喂类型：manual / scheduled

    device = relationship("Device", back_populates="feedings")
    user = relationship("User")


class Eating(Base):
    """
    进食记录表：
    - 存储猫咪的进食行为
    - 每条记录关联一个猫咪和一个设备
    """
    __tablename__ = "eatings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)      # 用户 ID
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)  # 设备 ID
    cat_id = Column(Integer, ForeignKey("cats.id"), nullable=False)        # 猫咪 ID
    start_time = Column(DateTime, nullable=False)                          # 开始进食时间
    end_time = Column(DateTime, nullable=False)                            # 结束进食时间
    eaten_g = Column(Float, nullable=False)                                # 实际进食克数

    device = relationship("Device", back_populates="eatings")
    cat = relationship("Cat")
    user = relationship("User")
