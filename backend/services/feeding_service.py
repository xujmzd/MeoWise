from datetime import datetime, timedelta, timezone
from typing import Tuple

from sqlalchemy.orm import Session

import models

# 北京时区 UTC+8
BEIJING_TZ = timezone(timedelta(hours=8))


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
    - period = "weekly"：近 7 个自然日（今天往前推 6 天到今天）
    - period = "monthly"：近 28 个自然日（4 周，今天往前推 27 天到今天）

    返回 naive datetime（不带时区），以匹配数据库中的 datetime 字段。
    窗口统一按自然日对齐，保证总统计 stats 与分组 group_stats 口径一致。
    """
    # 使用北京时间计算时间范围
    now = datetime.now(BEIJING_TZ).replace(tzinfo=None)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "daily":
        # 当天 00:00 到现在
        start = today
    elif period == "weekly":
        # 近 7 个自然日，包含今天
        start = today - timedelta(days=6)
    elif period == "monthly":
        # 近 28 个自然日（4 周），包含今天
        start = today - timedelta(days=27)
    else:
        start = today - timedelta(days=6)
    return start, now

