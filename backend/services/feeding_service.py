from datetime import datetime, timedelta
from typing import Tuple

from sqlalchemy.orm import Session

from backend import models


def create_feeding_plan(
    db: Session,
    *,
    device: models.Device,
    name: str,
    time_of_day,
    days_of_week: str,
    amount_g: float,
    is_enabled: bool = True,
) -> models.FeedingPlan:
    plan = models.FeedingPlan(
        device=device,
        name=name,
        time_of_day=time_of_day,
        days_of_week=days_of_week,
        amount_g=amount_g,
        is_enabled=is_enabled,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def delete_feeding_plan(db: Session, plan: models.FeedingPlan) -> None:
    db.delete(plan)
    db.commit()


def get_time_range(period: str) -> Tuple[datetime, datetime]:
    """
    计算统计时间窗口：
    - period = "daily"：最近 24 小时
    - period = "weekly"：最近 7 天
    """
    now = datetime.utcnow()
    if period == "weekly":
        start = now - timedelta(days=7)
    else:
        start = now - timedelta(days=1)
    return start, now

