-- ============================================
-- 更新 devices 表结构
-- 执行方法：sqlite3 test.db < update_devices_table.sql
-- ============================================

-- 查看当前列
-- PRAGMA table_info(devices);

-- 添加缺失的列（如果不存在会报错，可忽略）
ALTER TABLE devices ADD COLUMN wifi_ssid TEXT;
ALTER TABLE devices ADD COLUMN wifi_password TEXT;
ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP;

-- 设置默认值
UPDATE devices SET updated_at = datetime('now') WHERE updated_at IS NULL;
