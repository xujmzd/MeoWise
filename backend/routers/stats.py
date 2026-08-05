from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from routers.auth import get_current_user
from services.feeding_service import get_time_range
import models

router = APIRouter(prefix="/stats", tags=["stats"])


def _r1(value: float) -> float:
    """数量与平均值统一保留 1 位小数"""
    return round(value, 1)


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

    # 总统计（数量与平均值统一保留 1 位小数）
    total_dispensed = _r1(sum(f.amount_g for f in feedings))  # 设备投喂总量
    total_eaten = _r1(sum(e.eaten_g for e in eatings))  # 猫咪实际进食总量
    total_sessions = len(eatings)
    avg_duration = (
        _r1(
            sum((e.end_time - e.start_time).total_seconds() for e in eatings if e.end_time)
            / total_sessions
        )
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
        for hour in range(end.hour + 1):
            hour_start = start.replace(hour=hour, minute=0, second=0, microsecond=0)
            hour_end = hour_start + timedelta(hours=1)
            if hour_end > end:
                hour_end = end

            hour_feedings = [f for f in feedings if hour_start <= f.feeding_time < hour_end]
            hour_eatings = [e for e in eatings if hour_start <= e.start_time < hour_end]

            avg_session_duration = _r1(
                sum((e.end_time - e.start_time).total_seconds() for e in hour_eatings if e.end_time)
                / len(hour_eatings)
                if hour_eatings else 0.0
            )

            group_stats.append({
                "label": f"{hour:02d}:00",
                "dispensed_g": _r1(sum(f.amount_g for f in hour_feedings)),
                "eaten_g": _r1(sum(e.eaten_g for e in hour_eatings)),
                "session_count": len(hour_eatings),
                "avg_duration_sec": avg_session_duration,
            })

    elif period == "weekly":
        # 周报：从当天往前共 7 个自然日，按日分组
        # 最后一天（今天）标签为「今天」，其余标签为日期（如 7/31、8/1…）
        for offset in range(7):
            day_start = start + timedelta(days=offset)
            day_end = day_start + timedelta(days=1)
            if day_end > end:
                day_end = end

            day_feedings = [f for f in feedings if day_start <= f.feeding_time < day_end]
            day_eatings = [e for e in eatings if day_start <= e.start_time < day_end]

            session_durations = [
                (e.end_time - e.start_time).total_seconds()
                for e in day_eatings if e.end_time
            ]
            avg_session_duration = (
                _r1(sum(session_durations) / len(session_durations))
                if session_durations else 0.0
            )
            total_duration = _r1(sum(session_durations)) if session_durations else 0.0

            label = "今天" if day_start.date() == end.date() else f"{day_start.month}/{day_start.day}"

            group_stats.append({
                "label": label,
                "dispensed_g": _r1(sum(f.amount_g for f in day_feedings)),
                "eaten_g": _r1(sum(e.eaten_g for e in day_eatings)),
                "session_count": len(day_eatings),
                "avg_duration_sec": avg_session_duration,
                "total_duration_sec": total_duration,
            })

    elif period == "monthly":
        # 月报：近 28 个自然日，按周分组（4 周）
        week_num = 1
        while week_num <= 4:
            week_start = start + timedelta(days=(week_num - 1) * 7)
            week_end = week_start + timedelta(days=7)
            if week_end > end:
                week_end = end

            week_feedings = [f for f in feedings if week_start <= f.feeding_time < week_end]
            week_eatings = [e for e in eatings if week_start <= e.start_time < week_end]

            avg_session_duration = _r1(
                sum((e.end_time - e.start_time).total_seconds() for e in week_eatings if e.end_time)
                / len(week_eatings)
                if week_eatings else 0.0
            )

            group_stats.append({
                "label": f"第{week_num}周",
                "dispensed_g": _r1(sum(f.amount_g for f in week_feedings)),
                "eaten_g": _r1(sum(e.eaten_g for e in week_eatings)),
                "session_count": len(week_eatings),
                "avg_duration_sec": avg_session_duration,
            })

            week_num += 1

    return {
        "stats": stats,
        "group_stats": group_stats,
        "period": period,
        "range_start": start.isoformat(),
        "range_end": end.isoformat(),
    }
