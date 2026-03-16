import asyncio
from typing import Any, Dict
import aiomqtt
import ssl

ssl_ctx = ssl.create_default_context()

from backend.config import settings
class MqttService:
    """
    简单封装 EMQX Cloud MQTT 客户端。
    在 Serverless 场景中建议：
    - 只在需要时短连接发送指令（例如手动放粮）
    - 长连接/订阅由独立的常驻服务或边缘网关实现
    """

    def __init__(self) -> None:
        self._host = settings.MQTT_BROKER_HOST
        self._port = settings.MQTT_BROKER_PORT
        self._username = settings.MQTT_USERNAME
        self._password = settings.MQTT_PASSWORD
        self._base_topic = settings.MQTT_BASE_TOPIC.rstrip("/")

    async def publish(
        self, device_sn: str, sub_topic: str, payload: Dict[str, Any]
    ) -> None:
        topic = f"{self._base_topic}/{device_sn}/{sub_topic}"
        # 在 Serverless 中使用短生命周期连接
        async with aiomqtt.Client(
                self._host,
                port=self._port,
                username=self._username,
                password=self._password,
                tls_context=ssl_ctx,

        ) as client:
            import json
            await client.publish(topic, json.dumps(payload))

mqtt_service = MqttService()

