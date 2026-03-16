from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.services.security import get_password_hash, verify_password


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserRead, summary="获取当前用户信息")
def get_me(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    返回当前登录用户的基本资料：
    - 邮箱
    - 昵称
    - 头像地址
    - 创建/更新时间等
    """
    return current_user


@router.patch(
    "/me",
    response_model=schemas.UserRead,
    summary="更新当前用户个人资料（昵称、头像等）",
)
def update_me(
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    data = user_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


class ChangePasswordPayload(BaseModel):
    old_password: str
    new_password: str


@router.post(
    "/me/change_password",
    response_model=schemas.Msg,
    summary="修改当前用户密码",
)
def change_password(
    payload: ChangePasswordPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.Msg:
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect",
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()

    return schemas.Msg(message="Password updated successfully")

