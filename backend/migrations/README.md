# MeoWise 数据库迁移指南

## 表结构概览

| 表名 | 说明 | 记录数 |
|------|------|--------|
| users | 用户表 - 存储用户认证和基本信息 | - |
| cats | 猫咪表 - 存储猫咪信息 | - |
| devices | 设备表 - 存储智能喂食设备信息 | - |
| feeding_plans | 喂食计划表 - 存储定时喂食计划 | - |
| feedings | 喂食记录表 - 存储投喂历史 | - |
| eatings | 进食记录表 - 存储猫咪进食记录 | - |

## 表结构详情

### 1. users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| email | VARCHAR(255) | 邮箱，唯一 |
| hashed_password | VARCHAR(255) | 密码哈希 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| phone | VARCHAR(20) | 手机号，唯一 |
| nickname | VARCHAR(100) | 昵称 |
| avatar_id | INTEGER | 头像 ID |

### 2. cats（猫咪表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | VARCHAR(100) | 猫咪名字 |
| standard_weight_kg | REAL | 标准体重（kg） |
| avatar_id | INTEGER | 头像 ID |
| user_id | INTEGER | 所属用户 ID（外键） |

### 3. devices（设备表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| device_sn | VARCHAR(255) | 设备序列号，唯一 |
| name | VARCHAR(255) | 设备名称 |
| user_id | INTEGER | 所属用户 ID（外键） |
| device_type | VARCHAR(50) | 设备类型：feeder/feeder_pro/water_fountain |
| wifi_ssid | VARCHAR(255) | WiFi 名称 |
| wifi_password | VARCHAR(255) | WiFi 密码 |
| bowl_weight_g | REAL | 食盆重量（克） |
| silo_remaining_pct | REAL | 粮仓余量百分比 |
| signal_strength | INTEGER | 信号强度 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 4. feeding_plans（喂食计划表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| device_id | INTEGER | 关联设备 ID（外键） |
| name | VARCHAR(100) | 计划名称 |
| time_of_day | VARCHAR(5) | 时间（如 "08:00"） |
| days_of_week | VARCHAR(50) | 执行日（如 "Mon,Tue,Wed,Thu,Fri,Sat,Sun"） |
| amount_g | REAL | 投喂克数 |
| is_enabled | INTEGER | 是否启用（0/1） |

### 5. feedings（喂食记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 投喂用户 ID（外键） |
| device_id | INTEGER | 投喂设备 ID（外键） |
| feeding_time | TIMESTAMP | 投喂时间 |
| amount_g | REAL | 投喂克数 |
| type | VARCHAR(20) | 类型：manual/scheduled |

### 6. eatings（进食记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户 ID（外键） |
| device_id | INTEGER | 设备 ID（外键） |
| cat_id | INTEGER | 猫咪 ID（外键） |
| start_time | TIMESTAMP | 开始进食时间 |
| end_time | TIMESTAMP | 结束进食时间 |
| eaten_g | REAL | 实际进食克数 |

## 外键关系图

```
users
  ├── cats (user_id)
  ├── devices (user_id)
  ├── feedings (user_id)
  └── eatings (user_id)

devices
  ├── feeding_plans (device_id)
  ├── feedings (device_id)
  └── eatings (device_id)

cats
  └── eatings (cat_id)
```

## 迁移方法

### 方法1：自动迁移脚本（推荐）

```bash
cd Z:\CodeDown\PythonProjects\MeoWise
python -m backend.migrations.run_migration
```

### 方法2：手动执行 SQL

```bash
cd Z:\CodeDown\PythonProjects\MeoWise\backend
sqlite3 test.db < migrations/complete_schema.sql
```

### 方法3：在 SQLite 命令行中执行

```bash
sqlite3 test.db
.read migrations/complete_schema.sql
```

### 方法4：完全重新创建数据库

```bash
cd Z:\CodeDown\PythonProjects\MeoWise
# 删除旧数据库
del backend\test.db
# 重新启动后端，自动创建表
uvicorn backend.main:app --reload
```

## 注意事项

1. **备份数据**：执行迁移前请备份重要数据
2. **外键约束**：删除表时需要按顺序删除（先删除依赖表）
3. **SQLite 限制**：SQLite 不支持 `CURRENT_TIMESTAMP` 作为 `ALTER TABLE ADD COLUMN` 的默认值
4. **时间戳**：使用 `datetime('now')` 替代 `CURRENT_TIMESTAMP`

## 生成时间

2026-04-06
