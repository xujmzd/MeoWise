from datetime import datetime, timedelta, timezone
from typing import Tuple

from sqlalchemy.orm import Session

import models


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
    - period = "daily"：当天 00:00 到现在
    - period = "weekly"：最近 7 天
    - period = "monthly"：最近 28 天（4周）
    
    返回 naive datetime（不带时区），以匹配数据库中的 datetime 字段
    """
    # 使用 naive datetime 以匹配数据库中的 DateTime 字段
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if period == "daily":
        # 当天 00:00 到现在
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start = now - timedelta(days=7)
    elif period == "monthly":
        start = now - timedelta(days=28)
    else:
        start = now - timedelta(days=7)
    return start, now

