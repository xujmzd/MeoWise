#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_report_data.py — MeoWise 报告数据生成脚本

作用：
    根据当前配置文件连接数据库，按现有表结构（users / cats / devices /
    feeding_plans / feedings / eatings）生成一份可用于验证「报告页面」的
    演示数据，时间范围默认从「今天往前 30 天」一直到「今天（最近几小时）」，
    这样 月报 / 周报 / 日报 都能显示出数据。

用法：
    python generate_report_data.py                # 使用当前配置的数据库（默认根目录 test.db）
    python generate_report_data.py --db sqlite:///./test.db
    python generate_report_data.py --start-days 30 --end-days 0
    python generate_report_data.py --end-days 7   # 严格：最近一个月 ~ 最近一周

参数：
    --db           覆盖数据库连接串（默认读取环境变量 DATABASE_URL，否则 sqlite:///./test.db）
    --start-days   最老的记录距离今天的天数（默认 30）
    --end-days     最新的记录距离今天的天数（默认 0 = 今天；7 = 一周前）
    --date         指定某一天（YYYY-MM-DD）生成全天多个时段的数据（与 start/end-days 互斥）
    --append       追加模式：不清理演示用户已有记录，只新增（默认会先清理再生成）
    --dry-run      只打印将生成的统计，不写库

说明：
    - 所有时间均为北京时间（数据库统一存储北京时间 naive datetime）
    - 脚本可重复执行：每次运行前会先清空演示用户的历史记录再重新生成，避免重复
    - 演示用户邮箱 report@meowise.demo / 密码 123456
"""

import argparse
import os
import random
import sys
from datetime import datetime, timedelta, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# 与 backend/main.py 保持一致：优先从 backend 目录解析模块
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

BEIJING_TZ = timezone(timedelta(hours=8))

DEMO_EMAIL = "report@meowise.demo"
DEMO_PASSWORD = "123456"
DEMO_NICKNAME = "报告演示用户"
DEMO_PHONE = "19900000000"

DEMO_DEVICES = [
    {"device_sn": "SN-DEMO-001", "name": "演示喂食器"},
    {"device_sn": "SN-DEMO-002", "name": "演示喂食器二"},
]

DEMO_CATS = [
    {"name": "小花", "standard_weight_kg": 4.5, "avatar_id": 2},
    {"name": "小黑", "standard_weight_kg": 5.0, "avatar_id": 3},
]

DEMO_PLANS = [
    {"name": "早餐", "time_of_day": "08:00", "days_of_week": "Mon,Tue,Wed,Thu,Fri", "amount_g": 20.0},
    {"name": "午餐", "time_of_day": "12:30", "days_of_week": "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "amount_g": 25.0},
    {"name": "晚餐", "time_of_day": "18:30", "days_of_week": "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "amount_g": 30.0},
]

# 每天三个固定餐点（小时, 分钟），加随机抖动
MEAL_TIMES = [(8, 0), (12, 30), (18, 30)]


def bj_now() -> datetime:
    """当前北京时间（naive，去除时区信息）"""
    return datetime.now(BEIJING_TZ).replace(tzinfo=None)


def clamp_to_past(dt: datetime) -> datetime:
    """确保生成的时间不晚于当前时刻，避免出现未来时间"""
    now = bj_now()
    return dt if dt <= now else now


def _ensure_user(db) -> object:
    user = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
    if not user:
        user = models.User(
            email=DEMO_EMAIL,
            hashed_password=get_password_hash(DEMO_PASSWORD),
            nickname=DEMO_NICKNAME,
            phone=DEMO_PHONE,
            avatar_id=0,
        )
        db.add(user)
        db.flush()
        print(f"  [+] 创建演示用户: {DEMO_EMAIL}（密码 {DEMO_PASSWORD}）")
    else:
        print(f"  [=] 复用演示用户: {DEMO_EMAIL}")
    return user


def _ensure_cats(db, user) -> list:
    cats = []
    for c in DEMO_CATS:
        cat = (
            db.query(models.Cat)
            .filter(models.Cat.user_id == user.id, models.Cat.name == c["name"])
            .first()
        )
        if not cat:
            cat = models.Cat(
                user_id=user.id,
                name=c["name"],
                standard_weight_kg=c["standard_weight_kg"],
                avatar_id=c["avatar_id"],
            )
            db.add(cat)
            db.flush()
            print(f"  [+] 创建猫咪: {c['name']}")
        cats.append(cat)
    return cats


def _ensure_devices(db, user) -> list:
    devices = []
    for d in DEMO_DEVICES:
        dev = db.query(models.Device).filter(models.Device.device_sn == d["device_sn"]).first()
        if not dev:
            dev = models.Device(
                device_sn=d["device_sn"],
                name=d["name"],
                user_id=user.id,
                wifi_ssid="MeoWise-Demo",
                wifi_password="demo123456",
                bowl_weight_g=round(random.uniform(5, 40), 1),
                silo_remaining_pct=round(random.uniform(40, 90), 1),
                signal_strength=random.randint(-70, -30),
                updated_at=bj_now(),
            )
            db.add(dev)
            db.flush()
            print(f"  [+] 创建设备: {d['device_sn']} ({d['name']})")
        else:
            dev.updated_at = bj_now()
        devices.append(dev)
    return devices


def _ensure_plans(db, user, devices) -> None:
    device = devices[0]
    for p in DEMO_PLANS:
        exists = (
            db.query(models.FeedingPlan)
            .filter(
                models.FeedingPlan.device_id == device.id,
                models.FeedingPlan.name == p["name"],
                models.FeedingPlan.time_of_day == p["time_of_day"],
            )
            .first()
        )
        if not exists:
            db.add(
                models.FeedingPlan(
                    device_id=device.id,
                    name=p["name"],
                    time_of_day=p["time_of_day"],
                    days_of_week=p["days_of_week"],
                    amount_g=p["amount_g"],
                    is_enabled=True,
                )
            )
            print(f"  [+] 创建喂食计划: {p['name']} {p['time_of_day']}")


def _clean_demo_records(db, user) -> None:
    """清空演示用户历史记录，保证脚本可重复执行"""
    device_ids = [d.id for d in db.query(models.Device).filter(models.Device.user_id == user.id).all()]
    if not device_ids:
        return
    deleted_eat = (
        db.query(models.Eating)
        .filter(models.Eating.device_id.in_(device_ids), models.Eating.user_id == user.id)
        .delete(synchronize_session=False)
    )
    deleted_feed = (
        db.query(models.Feeding)
        .filter(models.Feeding.device_id.in_(device_ids), models.Feeding.user_id == user.id)
        .delete(synchronize_session=False)
    )
    print(f"  [-] 清空演示用户旧记录: feedings={deleted_feed}, eatings={deleted_eat}")


def _add_feed_eat(db, user, device, cats, t, counters) -> None:
    """在某时间点生成一次投喂，并大概率伴随一次进食会话"""
    amount = round(random.uniform(15, 40), 1)
    feed_type = "manual" if random.random() < 0.45 else "scheduled"
    db.add(
        models.Feeding(
            user_id=user.id,
            device_id=device.id,
            feeding_time=t,
            amount_g=amount,
            type=feed_type,
        )
    )
    counters["feedings"] += 1

    if random.random() < 0.82:
        start = t + timedelta(minutes=random.randint(10, 45))
        end = start + timedelta(minutes=random.randint(6, 18))
        eaten = round(amount * random.uniform(0.6, 0.95), 1)
        cat = random.choice(cats)
        db.add(
            models.Eating(
                user_id=user.id,
                device_id=device.id,
                cat_id=cat.id,
                start_time=start,
                end_time=end,
                eaten_g=eaten,
            )
        )
        counters["eatings"] += 1


def _generate_records(db, user, devices, cats, start_days, end_days) -> dict:
    """从 start_days 天前到 end_days 天前逐天生成数据"""
    counters = {"feedings": 0, "eatings": 0}
    now = bj_now()
    today = now.date()

    for offset in range(start_days, end_days - 1, -1):
        day = today - timedelta(days=offset)

        if offset == 0:
            # 今天：只生成最近几小时内的少量记录，保证「日报」也有数据
            for hours_ago in (5, 3, 1):
                t = now - timedelta(hours=hours_ago, minutes=random.randint(0, 40))
                _add_feed_eat(db, user, devices[0], cats, t, counters)
            continue

        if random.random() < 0.08:
            # 8% 概率当天无任何记录（模拟宠物外出/设备离线）
            continue

        device = random.choice(devices)
        for hour, minute in MEAL_TIMES:
            t = datetime(day.year, day.month, day.day, hour, minute) + timedelta(
                minutes=random.randint(-15, 15)
            )
            t = clamp_to_past(t)
            _add_feed_eat(db, user, device, cats, t, counters)

    return counters


# 指定日期生成时覆盖的时段（凌晨 / 早 / 上午 / 中午 / 下午 / 傍晚 / 夜间）
DATE_HOURS = [0, 1, 7, 8, 11, 12, 15, 17, 19, 21, 22]


def _generate_records_for_date(db, user, devices, cats, target_date) -> dict:
    """为指定日期生成全天多个时段的进食/喂食数据（包含未来时段，随时间逐步显示）"""
    counters = {"feedings": 0, "eatings": 0}
    for hour in DATE_HOURS:
        minute = random.randint(0, 40)
        t = datetime(target_date.year, target_date.month, target_date.day, hour, minute)
        device = random.choice(devices)
        _add_feed_eat(db, user, device, cats, t, counters)
    return counters


def main(args) -> None:
    os.environ["DATABASE_URL"] = (
        args.db if args.db else os.environ.get("DATABASE_URL", "sqlite:///./test.db")
    )

    # 延迟导入，保证 --db 参数生效
    global models, get_password_hash
    from database import engine, SessionLocal, Base
    import models as _models
    from services.security import get_password_hash as _get_password_hash

    models = _models
    get_password_hash = _get_password_hash

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        now = bj_now()
        start_date = (now - timedelta(days=args.start_days)).date()
        end_date = (now - timedelta(days=args.end_days)).date()
        print("=" * 60)
        print("MeoWise 报告数据生成脚本")
        print(f"  数据库: {engine.url}")
        print(f"  时间范围: {start_date} ~ {end_date}（北京时间）")
        print("=" * 60)

        user = _ensure_user(db)
        cats = _ensure_cats(db, user)
        devices = _ensure_devices(db, user)
        _ensure_plans(db, user, devices)

        if not args.append:
            _clean_demo_records(db, user)

        if args.dry_run:
            print("[dry-run] 仅预览，不写入数据")
            print(f"  [*] 预估生成: 猫咪={len(cats)}, 设备={len(devices)}")
            return

        if args.date:
            target_date = datetime.strptime(args.date, "%Y-%m-%d").date()
            print(f"  生成日期: {target_date}（全天多个时段）")
            counters = _generate_records_for_date(db, user, devices, cats, target_date)
        else:
            counters = _generate_records(db, user, devices, cats, args.start_days, args.end_days)
        db.commit()

        total_feedings = (
            db.query(models.Feeding).filter(models.Feeding.user_id == user.id).count()
        )
        total_eatings = db.query(models.Eating).filter(models.Eating.user_id == user.id).count()
        print("-" * 60)
        print(f"  本次新增: feedings={counters['feedings']}, eatings={counters['eatings']}")
        print(f"  当前总量: feedings={total_feedings}, eatings={total_eatings}")
        print(
            "  演示账号: report@meowise.demo / 123456  "
            "(可在报告页用该账号登录查看数据)"
        )
        print("完成。")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MeoWise 报告数据生成脚本")
    parser.add_argument("--db", help="数据库连接串，如 sqlite:///./test.db")
    parser.add_argument("--start-days", type=int, default=30, help="最老记录距今天数（默认 30）")
    parser.add_argument("--end-days", type=int, default=0, help="最新记录距今天数（默认 0=今天）")
    parser.add_argument("--date", help="指定某一天（YYYY-MM-DD）生成全天多个时段数据")
    parser.add_argument("--append", action="store_true", help="追加模式：不清理已有记录，只新增")
    parser.add_argument("--dry-run", action="store_true", help="仅打印预览，不写库")
    _args = parser.parse_args()

    if _args.end_days > _args.start_days:
        parser.error("--end-days 不能大于 --start-days")

    if _args.date:
        try:
            datetime.strptime(_args.date, "%Y-%m-%d")
        except ValueError:
            parser.error("--date 格式应为 YYYY-MM-DD")

    main(_args)
