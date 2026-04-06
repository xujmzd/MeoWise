import asyncio
from backend.services.mqtt_client import mqtt_service
import sys

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def main():
    # 模拟设备编号和子主题
    device_sn = "DEVICE_SN_001"
    sub_topic = "feed"
    # 要发送的消息
    payload = {
  "device_sn": "SN001",
  "event": "feeding_session",
  "dispensed_g": 0,
  "eaten_g": 25,
  "start_time": "2026-03-17T12:10:00",
  "end_time": "2026-03-17T12:20:00",
  "cat_weight_kg": 4.8
}

    print(f"🚀 正在初始化 MQTT 监听器...")
    print(f"📍 目标地址: {mqtt_service._host}:{mqtt_service._port}")

    await mqtt_service.publish(device_sn, sub_topic, payload)
    print("✅ 已发布消息到 MQTT")

if __name__ == "__main__":
    asyncio.run(main())

