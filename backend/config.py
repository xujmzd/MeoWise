from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # 基本信息
    PROJECT_NAME: str = "MeoWise API"
    API_V1_PREFIX: str = "/api/v1"

    # 安全配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # 数据库配置
    DATABASE_URL = "postgresql://postgres:5geCQPUQdYEDu5wT@db.ajldgyrnapgxhsomfhku.supabase.co:5432/postgres"
    # 生产环境 (Supabase): postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
    #DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")

    # # MQTT (EMQX Cloud)
    # MQTT_BROKER_HOST: str = "icfc9c11.ala.cn-hangzhou.emqxsl.cn"
    # MQTT_BROKER_PORT: int = 8883
    # MQTT_USERNAME: str = "MeoWise1"
    # MQTT_PASSWORD: str = "123456"
    # MQTT_BASE_TOPIC: str = "meowise"
    # # MQTTX
    MQTT_BROKER_HOST: str = "broker.emqx.io"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USERNAME: str = "MQTTX1"
    MQTT_PASSWORD: str = "111111"
    MQTT_BASE_TOPIC: str = "meowise"

    # class Config:
    #     env_file = ".env"
    #     case_sensitive = True


settings = Settings()

