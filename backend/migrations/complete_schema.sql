-- ============================================================
-- MeoWise 喵食记 - 完整数据库表结构
-- 数据库类型：SQLite
-- 生成日期：2026-04-06
-- 说明：基于 SQLAlchemy models.py 生成的完整建表脚本
-- ============================================================

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- ============================================================
-- 表1: users（用户表）
-- 说明：存储用户的基本信息和认证信息
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,                      -- 邮箱（唯一登录标识）
    hashed_password VARCHAR(255) NOT NULL,                   -- 哈希后的密码
    created_at TIMESTAMP DEFAULT (datetime('now')),          -- 创建时间
    updated_at TIMESTAMP DEFAULT (datetime('now')),          -- 更新时间
    phone VARCHAR(20) UNIQUE,                                -- 手机号（唯一，用于找回密码）
    nickname VARCHAR(100),                                   -- 昵称
    avatar_id INTEGER                                        -- 用户头像 ID
);

-- 索引
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- ============================================================
-- 表2: cats（猫咪表）
-- 说明：存储猫咪的基本信息，每只猫咪属于一个用户
-- ============================================================
CREATE TABLE IF NOT EXISTS cats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,                              -- 猫咪名字
    standard_weight_kg REAL NOT NULL,                        -- 标准体重（kg）
    avatar_id INTEGER DEFAULT NULL,                          -- 猫咪头像 ID
    user_id INTEGER NOT NULL,                                -- 所属用户 ID
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS ix_cats_user_id ON cats(user_id);

-- ============================================================
-- 表3: devices（设备表）
-- 说明：存储物联网喂食设备的信息，每个设备属于一个用户
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_sn VARCHAR(255) NOT NULL UNIQUE,                  -- 设备序列号（唯一）
    name VARCHAR(255) NOT NULL,                              -- 设备名称
    user_id INTEGER NOT NULL,                                -- 所属用户 ID
    device_type VARCHAR(50) DEFAULT 'feeder',                -- 设备类型：feeder/feeder_pro/water_fountain
    
    -- WiFi 配置信息
    wifi_ssid VARCHAR(255),                                  -- WiFi 名称
    wifi_password VARCHAR(255),                              -- WiFi 密码（加密存储）
    
    -- 当前状态（由设备上报或系统缓存）
    bowl_weight_g REAL DEFAULT 0,                            -- 食盆重量（克）
    silo_remaining_pct REAL DEFAULT 100,                     -- 粮仓余量百分比
    signal_strength INTEGER DEFAULT 0,                       -- 信号强度
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT (datetime('now')),          -- 创建时间
    updated_at TIMESTAMP DEFAULT (datetime('now')),          -- 更新时间
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS ix_devices_device_sn ON devices(device_sn);
CREATE INDEX IF NOT EXISTS ix_devices_user_id ON devices(user_id);

-- ============================================================
-- 表4: feeding_plans（喂食计划表）
-- 说明：存储定时喂食计划，每个计划绑定到一个设备
-- ============================================================
CREATE TABLE IF NOT EXISTS feeding_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,                              -- 关联设备 ID
    name VARCHAR(100) NOT NULL,                              -- 计划名称
    time_of_day VARCHAR(5) NOT NULL,                         -- 每天的时间（如 "08:00"）
    days_of_week VARCHAR(50) NOT NULL,                       -- 哪些天执行（如 "Mon,Tue,Wed,Thu,Fri,Sat,Sun"）
    amount_g REAL NOT NULL,                                  -- 投喂克数
    is_enabled INTEGER DEFAULT 1,                            -- 是否启用（SQLite 中布尔值用 0/1）
    
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS ix_feeding_plans_device_id ON feeding_plans(device_id);

-- ============================================================
-- 表5: feedings（喂食记录表）
-- 说明：存储每次投喂的记录（手动或定时）
-- ============================================================
CREATE TABLE IF NOT EXISTS feedings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                                -- 投喂用户 ID
    device_id INTEGER NOT NULL,                              -- 投喂设备 ID
    feeding_time TIMESTAMP DEFAULT (datetime('now')),        -- 投喂时间
    amount_g REAL NOT NULL,                                  -- 投喂克数
    type VARCHAR(20) NOT NULL,                               -- 投喂类型：manual / scheduled
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS ix_feedings_user_id ON feedings(user_id);
CREATE INDEX IF NOT EXISTS ix_feedings_device_id ON feedings(device_id);
CREATE INDEX IF NOT EXISTS ix_feedings_feeding_time ON feedings(feeding_time);

-- ============================================================
-- 表6: eatings（进食记录表）
-- 说明：存储猫咪的进食行为，每条记录关联一个猫咪和一个设备
-- ============================================================
CREATE TABLE IF NOT EXISTS eatings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                                -- 用户 ID
    device_id INTEGER NOT NULL,                              -- 设备 ID
    cat_id INTEGER NOT NULL,                                 -- 猫咪 ID
    start_time TIMESTAMP NOT NULL,                           -- 开始进食时间
    end_time TIMESTAMP NOT NULL,                             -- 结束进食时间
    eaten_g REAL NOT NULL,                                   -- 实际进食克数
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS ix_eatings_user_id ON eatings(user_id);
CREATE INDEX IF NOT EXISTS ix_eatings_device_id ON eatings(device_id);
CREATE INDEX IF NOT EXISTS ix_eatings_cat_id ON eatings(cat_id);
CREATE INDEX IF NOT EXISTS ix_eatings_start_time ON eatings(start_time);

-- ============================================================
-- 触发器：自动更新 devices 表的 updated_at 字段
-- ============================================================
CREATE TRIGGER IF NOT EXISTS update_device_timestamp 
AFTER UPDATE ON devices
BEGIN
    UPDATE devices SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================
-- 触发器：自动更新 users 表的 updated_at 字段
-- ============================================================
CREATE TRIGGER IF NOT EXISTS update_user_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================
-- 验证表结构（查询语句，执行后可查看结果）
-- ============================================================
-- SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
-- PRAGMA table_info(users);
-- PRAGMA table_info(cats);
-- PRAGMA table_info(devices);
-- PRAGMA table_info(feeding_plans);
-- PRAGMA table_info(feedings);
-- PRAGMA table_info(eatings);

-- ============================================================
-- 初始化数据（可选，用于测试）
-- ============================================================
-- 示例用户
-- INSERT INTO users (email, hashed_password, nickname) 
-- VALUES ('test@example.com', '$2b$12$...', '测试用户');

-- 示例设备
-- INSERT INTO devices (device_sn, name, user_id, device_type) 
-- VALUES ('SN123456789', '客厅喂食器', 1, 'feeder');

-- 示例猫咪
-- INSERT INTO cats (name, standard_weight_kg, avatar_id, user_id) 
-- VALUES ('小橘', 4.5, 1, 1);

-- 示例喂食计划
-- INSERT INTO feeding_plans (device_id, name, time_of_day, days_of_week, amount_g) 
-- VALUES (1, '早餐', '08:00', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 20);

-- 示例投喂记录
-- INSERT INTO feedings (user_id, device_id, amount_g, type) 
-- VALUES (1, 1, 20.0, 'scheduled');

-- 示例进食记录
-- INSERT INTO eatings (user_id, device_id, cat_id, start_time, end_time, eaten_g) 
-- VALUES (1, 1, 1, datetime('now', '-30 minutes'), datetime('now'), 18.5);
