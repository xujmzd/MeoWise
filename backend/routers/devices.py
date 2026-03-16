from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.services.mqtt_client import mqtt_service


router = APIRouter(prefix="/devices", tags=["devices"])


def _get_device_for_user(
    db: Session, user: models.User, device_id: int
) -> models.Device:
    device = (
        db.query(models.Device)
        .filter(models.Device.id == device_id, models.Device.user_id == user.id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


@router.get("/", response_model=List[schemas.DeviceRead])
def list_devices(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    devices = (
        db.query(models.Device)
        .filter(models.Device.user_id == current_user.id)
        .all()
    )
    return devices


@router.post("/", response_model=schemas.DeviceRead)
def bind_device(
    device_in: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    绑定设备。
    - 前端通过蓝牙完成 Wi-Fi 配网（APP 层实现）
    - 成功后将设备 SN 与用户账号进行绑定
    """
    existing = (
        db.query(models.Device)
        .filter(models.Device.device_sn == device_in.device_sn)
        .first()
    )
    if existing and existing.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Device already bound"
        )
    if existing:
        return existing

    device = models.Device(
        device_sn=device_in.device_sn,
        name=device_in.name,
        owner=current_user,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/{device_id}", response_model=schemas.DeviceRead)
def get_device_detail(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    device = _get_device_for_user(db, current_user, device_id)
    return device


@router.post("/{device_id}/manual_feed", response_model=schemas.Msg)
async def manual_feed(
    device_id: int,
    amount_g: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    手动放粮：
    - 前端使用滑动解锁按钮，避免误触
    - 成功滑动后调用此接口，由后端转发 MQTT 指令到设备
    """
    device = _get_device_for_user(db, current_user, device_id)

    # 发送 MQTT 指令，具体 payload 结构需与设备固件约定
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

