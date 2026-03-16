-- 删除旧表（如果存在）
DROP TABLE IF EXISTS feeding_sessions;
DROP TABLE IF EXISTS feeding_plans;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS cats;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 猫咪表
CREATE TABLE cats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    standard_weight_kg REAL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 设备表
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_sn TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    bowl_weight_g REAL,
    silo_remaining_pct INTEGER,
    signal_strength INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 喂食计划表
CREATE TABLE feeding_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    time_of_day TEXT NOT NULL,
    days_of_week TEXT NOT NULL,
    amount_g REAL NOT NULL,
    is_enabled BOOLEAN DEFAULT 1,
    FOREIGN KEY(device_id) REFERENCES devices(id)
);

-- 喂食会话表
CREATE TABLE feeding_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    dispensed_g REAL,
    eaten_g REAL,
    FOREIGN KEY(device_id) REFERENCES devices(id)
);

-- 插入测试用户（密码需替换为真实哈希）
INSERT INTO users (email, hashed_password, nickname, avatar_url)
VALUES ('user@example.com', 'hashed_123456', '铲屎官小王', 'https://example.com/avatar.png');

-- 插入猫咪
INSERT INTO cats (user_id, name, standard_weight_kg)
VALUES (1, '小鱼干', 4.2);

-- 插入设备
INSERT INTO devices (user_id, device_sn, name, bowl_weight_g, silo_remaining_pct, signal_strength)
VALUES (1, 'DEVICE_SN_001', '客厅喂食器', 35, 80, 75);

-- 插入喂食计划
INSERT INTO feeding_plans (device_id, name, time_of_day, days_of_week, amount_g, is_enabled)
VALUES (1, '早餐', '08:00:00', '0,1,2,3,4,5,6', 20, 1);

-- 插入喂食会话
INSERT INTO feeding_sessions (device_id, start_time, end_time, dispensed_g, eaten_g)
VALUES (1, datetime('now'), datetime('now','+2 minutes'), 20, 18);

