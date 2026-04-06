-- ============================================
-- 数据库迁移脚本：为 devices 表添加新字段
-- 执行日期：2024-01-15
-- 说明：添加设备类型、WiFi配置、时间戳字段
-- ============================================

-- 1. 添加设备类型字段
ALTER TABLE devices ADD COLUMN device_type VARCHAR(50) DEFAULT 'feeder';

-- 2. 添加 WiFi 配置字段
ALTER TABLE devices ADD COLUMN wifi_ssid VARCHAR(255);
ALTER TABLE devices ADD COLUMN wifi_password VARCHAR(255);

-- 3. 添加时间戳字段
ALTER TABLE devices ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. 为现有记录设置默认时间
UPDATE devices SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- 5. 为 updated_at 添加自动更新触发器
CREATE OR REPLACE FUNCTION update_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_device_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_device_updated_at();

-- 完成提示
-- 如果使用 PostgreSQL，请确保执行成功后检查：
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'devices';

-- 对于 SQLite 数据库，使用以下简化版本：
-- ALTER TABLE devices ADD COLUMN device_type TEXT DEFAULT 'feeder';
-- ALTER TABLE devices ADD COLUMN wifi_ssid TEXT;
-- ALTER TABLE devices ADD COLUMN wifi_password TEXT;
-- ALTER TABLE devices ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
