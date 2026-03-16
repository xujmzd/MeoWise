from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.services.feeding_service import get_time_range


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


@router.get(
    "/devices/{device_id}/sessions",
    response_model=List[schemas.FeedingSessionRead],
)
def list_sessions(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    device = _get_device_for_user(db, current_user, device_id)
    sessions = (
        db.query(models.FeedingSession)
        .filter(
            models.FeedingSession.device_id == device.id,
            models.FeedingSession.user_id == current_user.id,
        )
        .order_by(models.FeedingSession.start_time.desc())
        .all()
    )
    return sessions


@router.get(
    "/devices/{device_id}/report/{period}",
    response_model=schemas.FeedingReport,
)
def feeding_report(
    device_id: int,
    period: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    进食报告：
    - period = daily：最近 24 小时
    - period = weekly：最近 7 天
    """
    if period not in {"daily", "weekly"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid period"
        )

    device = _get_device_for_user(db, current_user, device_id)
    start, end = get_time_range(period)

    # 查询原始 session 列表
    sessions: List[models.FeedingSession] = (
        db.query(models.FeedingSession)
        .filter(
            models.FeedingSession.device_id == device.id,
            models.FeedingSession.user_id == current_user.id,
            models.FeedingSession.start_time >= start,
            models.FeedingSession.start_time <= end,
        )
        .order_by(models.FeedingSession.start_time.asc())
        .all()
    )

    if not sessions:
        empty_stats = schemas.FeedingStats(
            total_sessions=0,
            total_dispensed_g=0.0,
            total_eaten_g=0.0,
            avg_session_duration_sec=0.0,
        )
        return schemas.FeedingReport(
            period=period,
            date=end,
            stats=empty_stats,
            sessions=[],
        )

    # 统计指标
    total_sessions = len(sessions)
    total_dispensed = sum(s.dispensed_g for s in sessions)
    total_eaten = sum((s.eaten_g or 0.0) for s in sessions)

    # 使用 SQL 计算平均时长（秒），如果 end_time 为空则按 start_time 代替
    duration_expr = func.extract(
        "epoch",
        func.coalesce(models.FeedingSession.end_time, models.FeedingSession.start_time)
        - models.FeedingSession.start_time,
    )
    avg_duration = (
        db.query(func.coalesce(func.avg(duration_expr), 0.0))
        .filter(
            models.FeedingSession.device_id == device.id,
            models.FeedingSession.user_id == current_user.id,
            models.FeedingSession.start_time >= start,
            models.FeedingSession.start_time <= end,
        )
        .scalar()
        or 0.0
    )

    stats = schemas.FeedingStats(
        total_sessions=total_sessions,
        total_dispensed_g=total_dispensed,
        total_eaten_g=total_eaten,
        avg_session_duration_sec=float(avg_duration),
    )

    sessions_out = [
        schemas.FeedingSessionRead.model_validate(s)  # type: ignore[arg-type]
        for s in sessions
    ]

    return schemas.FeedingReport(
        period=period,
        date=end,
        stats=stats,
        sessions=sessions_out,
    )

