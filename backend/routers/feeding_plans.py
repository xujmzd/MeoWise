from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from database import get_db
from routers.auth import get_current_user
from services.mqtt_client import mqtt_service, BEIJING_TZ
import models, schemas

router = APIRouter(prefix="/feeding_plans", tags=["feeding_plans"])


@router.post("/", response_model=schemas.FeedingPlanRead, summary="创建喂食计划")
def create_feeding_plan(
    plan_in: schemas.FeedingPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    创建喂食计划：
    - 绑定到某个设备
    - 指定每天的时间、星期几、投喂克数
    """
    plan = models.FeedingPlan(
        device_id=plan_in.device_id,
        name=plan_in.name,
        time_of_day=plan_in.time_of_day,
        days_of_week=plan_in.days_of_week,
        amount_g=plan_in.amount_g,
        is_enabled=True,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/", response_model=List[schemas.FeedingPlanRead], summary="获取当前设备的喂食计划")
def list_feeding_plans(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    获取某个设备的所有喂食计划
    """
    plans = db.query(models.FeedingPlan).filter(models.FeedingPlan.device_id == device_id).all()
    return plans


@router.post("/manual_feed", response_model=schemas.Msg, summary="手动投喂")
async def manual_feed(
    device_id: int,
    amount_g: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    手动投喂：
    - 前端调用此接口，后端转发 MQTT 指令到设备
    - 同时记录 feedings 表
    """
    feeding = models.Feeding(
        user_id=current_user.id,
        device_id=device_id,
        feeding_time=datetime.now(BEIJING_TZ).replace(tzinfo=None),
        amount_g=amount_g,
        type="manual",
    )
    db.add(feeding)
    db.commit()

    await mqtt_service.publish(
        device_sn=db.query(models.Device).get(device_id).device_sn,
        sub_topic="feed/manual",
        payload={"command": "DISPENSE", "amount_g": amount_g, "from": "app", "user_id": current_user.id},
    )
    return schemas.Msg(message="Manual feed command sent")


@router.get("/activities", summary="获取最近 N 条或全部活动")
def get_activities(
    device_id: int,
    limit: int | None = None,
    activity_type: str = "all",  # 可选值: "feeding", "eating", "all"
    cat_id: int | None = None,  # 可选，筛选特定猫咪的进食记录
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    获取最近 N 条或全部活动：
    - activity_type 可选 "feeding"（仅喂食）、"eating"（仅进食）、"all"（全部）
    - limit 可选，限制返回条数；如果不传则返回全部
    - cat_id 可选，筛选特定猫咪的进食记录
    - 按时间倒序排列
    """
    print("feeding_plans router loaded")

    activities = []

    # 获取喂食记录
    if activity_type in ("feeding", "all"):
        feedings = (
            db.query(models.Feeding)
            .filter(models.Feeding.device_id == device_id, models.Feeding.user_id == current_user.id)
            .all()
        )
        for f in feedings:
            activities.append({
                "type": "feeding",
                "time": f.feeding_time,
                "amount_g": f.amount_g,
                "feeding_id": f.id
            })

    # 获取进食记录
    if activity_type in ("eating", "all"):
        eatings_query = (
            db.query(models.Eating)
            .filter(models.Eating.device_id == device_id, models.Eating.user_id == current_user.id)
        )
        if cat_id:
            eatings_query = eatings_query.filter(models.Eating.cat_id == cat_id)
        eatings = eatings_query.all()
        for e in eatings:
            activities.append({
                "type": "eating",
                "time": e.start_time,
                "amount_g": e.eaten_g,
                "cat_id": e.cat_id,
                "eating_id": e.id
            })

    # 按时间倒序排序
    activities.sort(key=lambda x: x["time"], reverse=True)

    # 如果指定 limit，则截取前 N 条
    if limit:
        activities = activities[:limit]

    return activities


@router.patch("/{plan_id}", response_model=schemas.FeedingPlanRead, summary="更新喂食计划")
def update_feeding_plan(
    plan_id: int,
    plan_in: schemas.FeedingPlanUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    更新喂食计划：
    - 支持部分更新（name, time_of_day, days_of_week, amount_g, is_enabled）
    - 根据 plan_id 查找计划
    """
    plan = db.query(models.FeedingPlan).filter(models.FeedingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Feeding plan not found")

    # 只更新提供的字段
    if plan_in.name is not None:
        plan.name = plan_in.name
    if plan_in.time_of_day is not None:
        plan.time_of_day = plan_in.time_of_day
    if plan_in.days_of_week is not None:
        plan.days_of_week = plan_in.days_of_week
    if plan_in.amount_g is not None:
        plan.amount_g = plan_in.amount_g
    if plan_in.is_enabled is not None:
        plan.is_enabled = plan_in.is_enabled

    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", response_model=schemas.Msg, summary="删除喂食计划")
def delete_feeding_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    删除喂食计划：
    - 根据 plan_id 查找计划
    - 删除该计划
    """
    plan = db.query(models.FeedingPlan).filter(models.FeedingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Feeding plan not found")

    db.delete(plan)
    db.commit()
    return schemas.Msg(message="Feeding plan deleted")
