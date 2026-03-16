from datetime import datetime, time
from typing import List, Optional

from pydantic import BaseModel, EmailStr


#
# 基础通用 schema
#


class Msg(BaseModel):
    message: str


#
# 用户 & 认证
#


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    nickname: str | None = None
    avatar_url: str | None = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    nickname: str | None = None
    avatar_url: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


#
# 猫咪
#


class CatBase(BaseModel):
    name: str
    standard_weight_kg: float


class CatCreate(CatBase):
    pass


class CatRead(CatBase):
    id: int

    class Config:
        from_attributes = True


#
# 设备
#


class DeviceBase(BaseModel):
    device_sn: str
    name: str


class DeviceCreate(DeviceBase):
    pass


class DeviceRead(DeviceBase):
    id: int
    bowl_weight_g: float
    silo_remaining_pct: float
    signal_strength: int

    class Config:
        from_attributes = True


#
# 定时喂食计划
#


class FeedingPlanBase(BaseModel):
    name: str
    time_of_day: time
    # 0-6 表示周日到周六
    days_of_week: str = "0,1,2,3,4,5,6"
    amount_g: float
    is_enabled: bool = True


class FeedingPlanCreate(FeedingPlanBase):
    device_id: int


class FeedingPlanUpdate(BaseModel):
    name: Optional[str] = None
    time_of_day: Optional[time] = None
    days_of_week: Optional[str] = None
    amount_g: Optional[float] = None
    is_enabled: Optional[bool] = None


class FeedingPlanRead(FeedingPlanBase):
    id: int
    device_id: int

    class Config:
        from_attributes = True


#
# 进食会话 & 报告
#


class FeedingSessionRead(BaseModel):
    id: int
    device_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    dispensed_g: float
    eaten_g: Optional[float] = None

    class Config:
        from_attributes = True


class FeedingStats(BaseModel):
    total_sessions: int
    total_dispensed_g: float
    total_eaten_g: float
    avg_session_duration_sec: float


class FeedingReport(BaseModel):
    period: str  # "daily" / "weekly"
    date: datetime
    stats: FeedingStats
    sessions: List[FeedingSessionRead]

