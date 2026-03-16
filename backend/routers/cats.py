from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user


router = APIRouter(prefix="/cats", tags=["cats"])


@router.get(
    "/", response_model=List[schemas.CatRead], summary="获取当前用户的所有猫咪"
)
def list_cats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[models.Cat]:
    return (
        db.query(models.Cat)
        .filter(models.Cat.user_id == current_user.id)
        .order_by(models.Cat.id.asc())
        .all()
    )


@router.post(
    "/", response_model=schemas.CatRead, summary="为当前用户新增一只猫咪"
)
def create_cat(
    cat_in: schemas.CatCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Cat:
    cat = models.Cat(
        name=cat_in.name,
        standard_weight_kg=cat_in.standard_weight_kg,
        owner=current_user,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch(
    "/{cat_id}",
    response_model=schemas.CatRead,
    summary="更新当前用户的一只猫咪信息",
)
def update_cat(
    cat_id: int,
    cat_in: schemas.CatCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Cat:
    cat = (
        db.query(models.Cat)
        .filter(models.Cat.id == cat_id, models.Cat.user_id == current_user.id)
        .first()
    )
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cat not found"
        )

    cat.name = cat_in.name
    cat.standard_weight_kg = cat_in.standard_weight_kg
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete(
    "/{cat_id}",
    response_model=schemas.Msg,
    summary="删除当前用户的一只猫咪",
)
def delete_cat(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.Msg:
    cat = (
        db.query(models.Cat)
        .filter(models.Cat.id == cat_id, models.Cat.user_id == current_user.id)
        .first()
    )
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cat not found"
        )

    db.delete(cat)
    db.commit()
    return schemas.Msg(message="Cat deleted")

