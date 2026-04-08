import os

# 直接从环境变量读取，不要默认值
DATABASE_URL = os.environ.get("DATABASE_URL", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "")

# 简单的配置对象
class Settings:
    PROJECT_NAME: str = "MeoWise API"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = SECRET_KEY if SECRET_KEY else "CHANGE_ME_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = DATABASE_URL
    MQTT_BROKER_HOST: str = "broker.emqx.io"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USERNAME: str = "MQTTX1"
    MQTT_PASSWORD: str = "111111"
    MQTT_BASE_TOPIC: str = "meowise"

settings = Settings()

