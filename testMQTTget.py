import asyncio
import json
import ssl
import sys
from typing import Any
import aiomqtt

# 导入你的配置
from backend.config import settings

# Windows 异步兼容性处理
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# TLS 安全上下文
ssl_ctx = ssl.create_default_context()


class MqttListenerService:
    def __init__(self) -> None:
        self._host = settings.MQTT_BROKER_HOST
        self._port = settings.MQTT_BROKER_PORT
        self._username = settings.MQTT_USERNAME
        self._password = settings.MQTT_PASSWORD
        self._base_topic = settings.MQTT_BASE_TOPIC.rstrip("/")

    async def start_listening(self, device_sn: str = "+", sub_topic: str = "#"):
        """
        启动监听
        :param device_sn: 设备序列号，默认为 "+" (通配符，监听所有设备)
        :param sub_topic: 子主题，默认为 "#" (通配符，监听所有行为)
        """
        # 拼接订阅主题
        full_topic = f"{self._base_topic}/{device_sn}/{sub_topic}"

        print(f"🚀 正在初始化 MQTT 监听器...")
        print(f"📍 目标地址: {self._host}:{self._port}")
        print(f"📡 订阅主题: {full_topic}")

        async with aiomqtt.Client(
                hostname=self._host,
                port=self._port,
                username=self._username,
                password=self._password,
                tls_context=ssl_ctx,
        ) as client:
            # 订阅主题
            await client.subscribe(full_topic)
            print(f"✅ 订阅成功，等待消息中...")

            # 修复后的迭代逻辑：直接对 client.messages 进行迭代
            # 注意：在 aiomqtt v1.0+ 中，messages 是一个异步生成器属性
            async for message in client.messages:
                try:
                    payload_data = json.loads(message.payload.decode())
                    print(f"\n────────────────────────────────────────")
                    print(f"📥 收到消息")
                    print(f"🔹 主题: {message.topic}")
                    print(f"🔹 内容: {payload_data}")
                    print(f"────────────────────────────────────────")
                except json.JSONDecodeError:
                    print(f"⚠️ 收到非 JSON 格式消息: {message.payload}")
                except Exception as e:
                    print(f"❌ 处理消息时出错: {e}")


async def main():
    listener = MqttListenerService()
    try:
        # 你可以指定监听特定的设备，如 "DEVICE_SN_001"
        # 或者使用 "+" 监听 meowise/+/feed
        await listener.start_listening(device_sn="DEVICE_SN_001", sub_topic="feed")
    except KeyboardInterrupt:
        print("\n🛑 监听已由用户停止")
    except Exception as e:
        print(f"\n💥 运行崩溃: {e}")


if __name__ == "__main__":
    asyncio.run(main())