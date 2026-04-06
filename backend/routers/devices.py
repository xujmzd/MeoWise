from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.services.mqtt_client import mqtt_service

# 路由前缀 /devices，所有设备相关接口都在这里
router = APIRouter(prefix="/devices", tags=["devices"])


def _get_device_for_user(
    db: Session, user: models.User, device_id: int
) -> models.Device:
    """
    工具函数：根据 device_id 获取当前用户的设备
    - 只能查询属于当前用户的设备
    - 如果设备不存在或不属于该用户，抛出 404 异常
    """
    device = (
        db.query(models.Device)
        .filter(models.Device.id == device_id, models.Device.user_id == user.id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.get("/", response_model=List[schemas.DeviceRead], summary="获取当前用户的所有设备")
def list_devices(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    获取当前用户的所有设备：
    - 通过 current_user.id 过滤，只返回该用户绑定的设备
    - 返回结果使用 schemas.DeviceRead 序列化
    """
    devices = (
        db.query(models.Device)
        .filter(models.Device.user_id == current_user.id)
        .all()
    )
    return devices


@router.post("/", response_model=schemas.DeviceRead, summary="绑定新设备")
def bind_device(
    device_in: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    绑定设备：
    - 前端完成 Wi-Fi 配网流程后调用此接口
    - 将设备 SN 与用户账号进行绑定
    - 保存 WiFi 配置信息（用于设备重连）
    - 如果设备已存在且属于其他用户，返回错误
    - 如果设备已存在且属于当前用户，更新配置并返回该设备
    - 否则创建新设备并绑定到当前用户
    """
    existing = (
        db.query(models.Device)
        .filter(models.Device.device_sn == device_in.device_sn)
        .first()
    )
    if existing and existing.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Device already bound")
    
    if existing:
        # 更新设备信息
        existing.name = device_in.name
        if device_in.wifi_ssid:
            existing.wifi_ssid = device_in.wifi_ssid
        if device_in.wifi_password:
            existing.wifi_password = device_in.wifi_password
        db.commit()
        db.refresh(existing)
        return existing

    # 创建新设备
    device = models.Device(
        device_sn=device_in.device_sn,
        name=device_in.name,
        owner=current_user,
        wifi_ssid=device_in.wifi_ssid,
        wifi_password=device_in.wifi_password,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/{device_id}", response_model=schemas.DeviceRead, summary="获取设备详情")
def get_device_detail(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    获取设备详情：
    - 根据 device_id 查询设备
    - 必须属于当前用户，否则返回 404
    """
    device = _get_device_for_user(db, current_user, device_id)
    return device


@router.post("/{device_id}/manual_feed", response_model=schemas.Msg, summary="手动投喂")
async def manual_feed(
    device_id: int,
    amount_g: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    手动投喂：
    - 前端使用滑动解锁按钮，避免误触
    - 成功滑动后调用此接口，由后端转发 MQTT 指令到设备
    - 同时记录 feedings 表
    """
    device = _get_device_for_user(db, current_user, device_id)

    # 记录喂食到数据库
    feeding = models.Feeding(
        user_id=current_user.id,
        device_id=device_id,
        feeding_time=datetime.now(timezone.utc),
        amount_g=amount_g,
        type="manual",
    )
    db.add(feeding)
    db.commit()

    # 发送 MQTT 指令
    await mqtt_service.publish(
        device_sn=device.device_sn,
        sub_topic="feed/manual",
        payload={
            "command": "DISPENSE",
            "amount_g": amount_g,
            "from": "app",
            "user_id": current_user.id,
        },
    )
    return schemas.Msg(message="Feed command sent")
