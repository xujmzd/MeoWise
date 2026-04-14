from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

#
# 基础通用 schema
#

class Msg(BaseModel):
    """通用消息返回格式"""
    message: str


#
# 用户 & 认证
#

class UserBase(BaseModel):
    """用户基础信息"""
    email: str
    nickname: str | None = None
    avatar_id: int | None = None
    phone: str | None = None   # 新增字段，用于找回密码


class UserCreate(UserBase):
    """用户注册时使用，包含密码"""
    password: str


class UserLogin(UserBase):
    """用户登录时使用，包含密码"""
    password: str


class ChangePassword(BaseModel):
    """修改密码请求"""
    old_password: str
    new_password: str


class ResetPassword(BaseModel):
    """重置密码请求"""
    reset_token: str
    new_password: str


class UserRead(UserBase):
    """用户信息返回格式"""
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    nickname: str | None = None
    avatar_url: str | None = None  # 可选，前端展示头像 URL

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """用户修改个人信息请求"""
    nickname: str | None = None
    avatar_id: int | None = None
    phone: str | None = None


class Token(BaseModel):
    """JWT Token 返回格式"""
    access_token: str
    token_type: str = "bearer"


#
# 猫咪
#

class CatBase(BaseModel):
    """猫咪基础信息"""
    name: str
    standard_weight_kg: float
    avatar_id: int | None = None   # 新增字段，猫咪头像 ID

class CatCreate(CatBase):
    """新增猫咪请求"""
    pass

class CatRead(CatBase):
    """猫咪信息返回格式"""
    id: int

    class Config:
        from_attributes = True


#
# 设备
#

class DeviceBase(BaseModel):
    """设备基础信息"""
    device_sn: str
    name: str

class DeviceCreate(DeviceBase):
    """新增设备请求"""
    wifi_ssid: str | None = None           # WiFi 名称
    wifi_password: str | None = None       # WiFi 密码

class DeviceRead(DeviceBase):
    """设备信息返回格式"""
    id: int
    wifi_ssid: str | None = None
    bowl_weight_g: float
    silo_remaining_pct: float
    signal_strength: int
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


#
# 定时喂食计划
#

class FeedingPlanBase(BaseModel):
    """喂食计划基础信息"""
    device_id: int
    name: str
    time_of_day: str       # 每天的时间，如 "08:00"
    days_of_week: str      # 哪些天执行，如 "Mon,Tue,Wed"
    amount_g: float        # 投喂克数

class FeedingPlanCreate(FeedingPlanBase):
    """创建喂食计划请求"""
    pass

class FeedingPlanRead(FeedingPlanBase):
    """喂食计划返回格式"""
    id: int
    is_enabled: bool       # 是否启用

    model_config = {"from_attributes": True}


class FeedingPlanUpdate(BaseModel):
    """更新喂食计划请求（支持部分更新）"""
    name: str | None = None
    time_of_day: str | None = None
    days_of_week: str | None = None
    amount_g: float | None = None
    is_enabled: bool | None = None


#
# 进食会话 & 报告
#

class FeedingSessionRead(BaseModel):
    """单次进食会话信息"""
    id: int
    device_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    dispensed_g: float
    eaten_g: Optional[float] = None

    class Config:
        from_attributes = True


class FeedingStats(BaseModel):
    """统计信息"""
    total_sessions: int
    total_dispensed_g: float
    total_eaten_g: float
    avg_session_duration_sec: float


class FeedingReport(BaseModel):
    """进食报告"""
    period: str  # "daily" / "weekly"
    date: datetime
    stats: FeedingStats
    sessions: List[FeedingSessionRead]


#
# 找回密码
#

class ForgotPassword(BaseModel):
    """找回密码请求，必须同时提供邮箱和手机号"""
    email: str
    phone: str


#
# 时间同步
#

class TimeSync(BaseModel):
    """时间同步响应"""
    server_time: str  # ISO 格式 UTC 时间
    timezone: str     # 时区信息
    offset_seconds: int | None = None  # 客户端与服务器的时差（秒）
