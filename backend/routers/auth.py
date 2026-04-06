from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.config import settings
from backend.database import get_db
from backend.services.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)

# 路由前缀 /auth
router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth2 认证方式，前端登录时调用 /auth/token 获取 JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


# ---------------- 工具函数 ----------------

def get_user_by_email(db: Session, email: str) -> models.User | None:
    """通过邮箱查找用户"""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_phone(db: Session, phone: str) -> models.User | None:
    """通过手机号查找用户"""
    return db.query(models.User).filter(models.User.phone == phone).first()


def authenticate_user(db: Session, email: str, password: str) -> models.User | None:
    """
    验证用户登录：
    1. 根据邮箱查找用户
    2. 校验密码是否正确
    """
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """
    从 JWT token 中解析当前用户：
    1. 解码 token
    2. 获取 email
    3. 查询数据库
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


# ---------------- 路由接口 ----------------

@router.post("/register", response_model=schemas.UserRead)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    用户注册：
    1. 检查邮箱是否已存在
    2. 保存用户信息（密码需加密）
    """
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        nickname=user_in.nickname,
        avatar_id=user_in.avatar_id,
        phone=user_in.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    用户登录：
    1. 验证邮箱和密码
    2. 生成 JWT token
    """

    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return schemas.Token(access_token=access_token, token_type="bearer")


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    """
    找回密码：
    1. 用户必须同时提供邮箱和手机号
    2. 系统验证邮箱和手机号是否匹配同一个用户
    3. 如果匹配，生成重置 token（有效期 30 分钟）
    """

    # 根据邮箱查找用户
    user = get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=400, detail="Email not found")

    # 验证手机号是否匹配
    if user.phone != data.phone:
        raise HTTPException(status_code=400, detail="Phone number does not match")

    # 生成重置 token（有效期 30 分钟）
    reset_token = create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=30)
    )

    # 返回 token，前端可用它调用 /reset-password
    return {"reset_token": reset_token, "message": "Reset token generated"}



@router.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    """
    重置密码：
    1. 验证 reset_token 是否有效
    2. 更新用户密码
    """
    try:
        payload = jwt.decode(
            data.reset_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    db.add(user)
    db.commit()
    return {"message": "Password reset successfully"}


@router.post("/change-password")
def change_password(
    data: schemas.ChangePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    修改密码：
    1. 验证旧密码是否正确
    2. 更新新密码
    """
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    current_user.hashed_password = get_password_hash(data.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/me/change_password", response_model=schemas.Msg, summary="修改密码")
def change_password(
    data: schemas.ChangePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    修改密码：
    - 验证旧密码是否正确
    - 更新为新密码
    """
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password incorrect")

    current_user.hashed_password = get_password_hash(data.new_password)
    db.add(current_user)
    db.commit()
    return schemas.Msg(message="Password updated successfully")

@router.get("/me", response_model=schemas.UserRead, summary="获取当前用户信息")
def get_user_info(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    获取当前登录用户的信息：
    - 通过 JWT token 验证身份
    - 返回用户的基本信息
    """
    return current_user


@router.put("/me", response_model=schemas.UserRead, summary="更新当前用户信息")
def update_user_info(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    修改个人信息接口：
    - 支持修改昵称、头像 ID、手机号
    - 邮箱不可修改
    """
    if data.nickname is not None:
        current_user.nickname = data.nickname

    if data.avatar_id is not None:
        current_user.avatar_id = data.avatar_id

    if data.phone is not None:
        existing = db.query(models.User).filter(models.User.phone == data.phone).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        current_user.phone = data.phone

    current_user.updated_at = datetime.now(timezone.utc)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return current_user