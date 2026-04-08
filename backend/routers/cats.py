from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_user
import models, schemas

router = APIRouter(prefix="/cats", tags=["cats"])


@router.get(
    "/", response_model=List[schemas.CatRead], summary="获取当前用户的所有猫咪"
)
def list_cats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[models.Cat]:
    """
    获取当前登录用户的所有猫咪：
    - 通过 current_user.id 过滤，只返回该用户的猫咪
    - 按照猫咪 ID 升序排列
    - 返回结果使用 schemas.CatRead 序列化
    """
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
    """
    新增猫咪：
    - 接收前端传入的 CatCreate 数据（name、standard_weight_kg、avatar_id）
    - 将猫咪关联到当前用户（owner=current_user）
    - 保存到数据库并返回新增的猫咪信息
    """
    cat = models.Cat(
        name=cat_in.name,
        standard_weight_kg=cat_in.standard_weight_kg,
        avatar_id=cat_in.avatar_id,  # 支持头像字段
        owner=current_user,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch(
    "/{cat_id}",
    response_model=schemas.CatRead,
    summary="更新当前用户的一只猫咪信息（支持头像 avatar_id）",
)
def update_cat(
    cat_id: int,
    cat_in: schemas.CatCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Cat:
    """
    更新猫咪信息：
    - 根据 cat_id 查找猫咪，必须属于当前用户
    - 如果不存在，返回 404
    - 更新 name、standard_weight_kg、avatar_id
    - 保存并返回更新后的猫咪信息
    """
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
    cat.avatar_id = cat_in.avatar_id  # 更新头像字段

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
    """
    删除猫咪：
    - 根据 cat_id 查找猫咪，必须属于当前用户
    - 如果不存在，返回 404
    - 删除该猫咪并提交事务
    - 返回删除成功的消息
    """
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
