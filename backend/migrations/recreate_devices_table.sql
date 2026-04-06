-- ============================================
-- 重新创建 devices 表（删除旧表，创建新表）
-- 执行前请确保已备份重要数据！
-- ============================================

-- 步骤 1: 备份现有数据（如果有的话）
-- 注意：如果需要保留数据，先执行备份语句

-- 创建临时备份表（可选，如果有数据需要保留）
-- CREATE TEMPORARY TABLE devices_backup AS SELECT * FROM devices;

-- 步骤 2: 删除旧表（如果存在外键依赖，需要先删除相关表或禁用外键）
-- 注意：这会删除所有依赖于 devices 的数据（feeding_plans, feedings, eatings）

-- SQLite 方式：先删除外键依赖的表
DROP TABLE IF EXISTS feeding_plans;
DROP TABLE IF EXISTS feedings;
DROP TABLE IF EXISTS eatings;
DROP TABLE IF EXISTS devices;

-- 步骤 3: 创建新的 devices 表
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_sn VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    device_type VARCHAR(50) DEFAULT 'feeder',
    
    -- WiFi 配置信息
    wifi_ssid VARCHAR(255),
    wifi_password VARCHAR(255),
    
    -- 当前状态（由设备上报或系统缓存）
    bowl_weight_g FLOAT DEFAULT 0,
    silo_remaining_pct FLOAT DEFAULT 100,
    signal_strength INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 步骤 4: 创建索引（提高查询性能）
CREATE INDEX ix_devices_device_sn ON devices(device_sn);
CREATE INDEX ix_devices_user_id ON devices(user_id);

-- 步骤 5: 重新创建依赖表（如果需要完整重建数据库）
-- 请确保也重新创建 users 表（如果不存在）

-- 创建 users 表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20) UNIQUE,
    nickname VARCHAR(100),
    avatar_id INTEGER
);

-- 创建 cats 表
CREATE TABLE IF NOT EXISTS cats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    standard_weight_kg FLOAT NOT NULL,
    avatar_id INTEGER,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建 feeding_plans 表
CREATE TABLE IF NOT EXISTS feeding_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    time_of_day VARCHAR(5) NOT NULL,
    days_of_week VARCHAR(50) NOT NULL,
    amount_g FLOAT NOT NULL,
    is_enabled BOOLEAN DEFAULT 1,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 创建 feedings 表（投喂记录）
CREATE TABLE IF NOT EXISTS feedings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id INTEGER NOT NULL,
    feeding_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount_g FLOAT NOT NULL,
    type VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 创建 eatings 表（进食记录）
CREATE TABLE IF NOT EXISTS eatings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id INTEGER NOT NULL,
    cat_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    eaten_g FLOAT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
);

-- 验证表结构
-- .schema devices
-- .schema users
-- .schema cats
-- .schema feeding_plans
-- .schema feedings
-- .schema eatings
