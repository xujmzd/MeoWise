from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.services.feeding_service import create_feeding_plan, delete_feeding_plan


router = APIRouter(prefix="/feedings", tags=["feedings"])


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


def _get_plan_for_user(
    db: Session, user: models.User, plan_id: int
) -> models.FeedingPlan:
    plan = (
        db.query(models.FeedingPlan)
        .join(models.Device)
        .filter(
            models.FeedingPlan.id == plan_id,
            models.Device.user_id == user.id,
        )
        .first()
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.get(
    "/devices/{device_id}/plans", response_model=List[schemas.FeedingPlanRead]
)
def list_plans(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    device = _get_device_for_user(db, current_user, device_id)
    return device.feeding_plans


@router.post(
    "/devices/{device_id}/plans", response_model=schemas.FeedingPlanRead
)
def create_plan(
    device_id: int,
    plan_in: schemas.FeedingPlanBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    device = _get_device_for_user(db, current_user, device_id)
    plan = create_feeding_plan(
        db,
        device=device,
        name=plan_in.name,
        time_of_day=plan_in.time_of_day,
        days_of_week=plan_in.days_of_week,
        amount_g=plan_in.amount_g,
        is_enabled=plan_in.is_enabled,
    )
    return plan


@router.patch("/plans/{plan_id}", response_model=schemas.FeedingPlanRead)
def update_plan(
    plan_id: int,
    plan_in: schemas.FeedingPlanUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_plan_for_user(db, current_user, plan_id)
    data = plan_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(plan, field, value)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", response_model=schemas.Msg)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_plan_for_user(db, current_user, plan_id)
    delete_feeding_plan(db, plan)
    return schemas.Msg(message="Plan deleted")

