from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from routers.auth import get_current_user
from services.feeding_service import get_time_range
import models

router = APIRouter(prefix="/stats", tags=["stats"])


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


@router.get("/report", summary="获取统计报告")
def feeding_report(
    device_id: int,
    period: str,
    cat_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    获取进食报告：
    - period 可选：daily（最近 24 小时，按小时分组）、weekly（最近 7 天，按日分组）、monthly（最近 30 天，按周分组）
    - 可选 cat_id：统计某只猫的进食情况
    - 返回总统计和分组统计
    """
    if period not in {"daily", "weekly", "monthly"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid period")

    device = _get_device_for_user(db, current_user, device_id)
    start, end = get_time_range(period)

    # 获取投喂记录
    feedings = db.query(models.Feeding).filter(
        models.Feeding.device_id == device.id,
        models.Feeding.user_id == current_user.id,
        models.Feeding.feeding_time >= start,
        models.Feeding.feeding_time <= end,
    ).all()

    # 获取进食记录
    eatings_query = db.query(models.Eating).filter(
        models.Eating.device_id == device.id,
        models.Eating.user_id == current_user.id,
        models.Eating.start_time >= start,
        models.Eating.start_time <= end,
    )
    if cat_id:
        eatings_query = eatings_query.filter(models.Eating.cat_id == cat_id)
    eatings = eatings_query.all()

    # 总统计
    total_dispensed = sum(f.amount_g for f in feedings)  # 设备投喂总量
    total_eaten = sum(e.eaten_g for e in eatings)  # 猫咪实际进食总量
    total_sessions = len(eatings)
    avg_duration = (
        sum((e.end_time - e.start_time).total_seconds() for e in eatings if e.end_time)
        / total_sessions
        if total_sessions > 0 else 0.0
    )

    stats = {
        "total_dispensed_g": total_dispensed,  # 设备投喂量
        "total_eaten_g": total_eaten,  # 猫咪进食量
        "total_sessions": total_sessions,
        "avg_session_duration_sec": avg_duration,
    }

    # 分组统计
    group_stats = []
    
    if period == "daily":
        # 日报：按小时分组（从 00:00 到当前小时）
        current_hour = end.hour
        for hour in range(current_hour + 1):
            hour_start = start.replace(hour=hour, minute=0, second=0, microsecond=0)
            hour_end = hour_start + timedelta(hours=1)
            if hour_end > end:
                hour_end = end
            
            hour_feedings = [f for f in feedings if hour_start <= f.feeding_time < hour_end]
            hour_eatings = [e for e in eatings if hour_start <= e.start_time < hour_end]
            
            avg_session_duration = (
                sum((e.end_time - e.start_time).total_seconds() for e in hour_eatings if e.end_time)
                / len(hour_eatings)
                if hour_eatings else 0.0
            )
            
            group_stats.append({
                "label": f"{hour:02d}:00",
                "dispensed_g": sum(f.amount_g for f in hour_feedings),
                "eaten_g": sum(e.eaten_g for e in hour_eatings),
                "session_count": len(hour_eatings),
                "avg_duration_sec": avg_session_duration,
            })
    
    elif period == "weekly":
        # 周报：按日分组（7天）
        day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        current_day = start.date()
        day_index = 0
        
        while current_day <= end.date() and day_index < 7:
            day_start = datetime.combine(current_day, datetime.min.time())
            day_end = day_start + timedelta(days=1)
            
            day_feedings = [f for f in feedings if day_start <= f.feeding_time < day_end]
            day_eatings = [e for e in eatings if day_start <= e.start_time < day_end]
            
            avg_session_duration = (
                sum((e.end_time - e.start_time).total_seconds() for e in day_eatings if e.end_time)
                / len(day_eatings)
                if day_eatings else 0.0
            )
            
            group_stats.append({
                "label": day_names[day_index],
                "dispensed_g": sum(f.amount_g for f in day_feedings),
                "eaten_g": sum(e.eaten_g for e in day_eatings),
                "session_count": len(day_eatings),
                "avg_duration_sec": avg_session_duration,
            })
            
            current_day += timedelta(days=1)
            day_index += 1
    
    elif period == "monthly":
        # 月报：按周分组（4周）
        current_date = start
        week_num = 1
        
        while current_date <= end and week_num <= 4:
            week_end = current_date + timedelta(days=7)
            if week_end > end:
                week_end = end
            
            week_feedings = [f for f in feedings if current_date <= f.feeding_time < week_end]
            week_eatings = [e for e in eatings if current_date <= e.start_time < week_end]
            
            avg_session_duration = (
                sum((e.end_time - e.start_time).total_seconds() for e in week_eatings if e.end_time)
                / len(week_eatings)
                if week_eatings else 0.0
            )
            
            group_stats.append({
                "label": f"第{week_num}周",
                "dispensed_g": sum(f.amount_g for f in week_feedings),
                "eaten_g": sum(e.eaten_g for e in week_eatings),
                "session_count": len(week_eatings),
                "avg_duration_sec": avg_session_duration,
            })
            
            current_date = week_end
            week_num += 1

    return {
        "stats": stats,
        "group_stats": group_stats,
        "period": period,
    }
