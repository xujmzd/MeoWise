from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 基本信息
    PROJECT_NAME: str = "MeoWise API"
    API_V1_PREFIX: str = "/api/v1"

    # 安全配置
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # 数据库：默认使用本地 SQLite，便于开发快速启动；
    # 生产环境可通过环境变量 DATABASE_URL 覆盖为 Postgres / Supabase：
    DATABASE_URL: str = "sqlite:///./test.db"

    # MQTT (EMQX Cloud)
    MQTT_BROKER_HOST: str = "icfc9c11.ala.cn-hangzhou.emqxsl.cn"
    MQTT_BROKER_PORT: int = 8883
    MQTT_USERNAME: str = "MeoWise1"
    MQTT_PASSWORD: str = "123456"
    MQTT_BASE_TOPIC: str = "meowise"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

