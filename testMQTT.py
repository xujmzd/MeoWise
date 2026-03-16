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
    payload = {"action": "dispense", "amount_g": 20}

    await mqtt_service.publish(device_sn, sub_topic, payload)
    print("✅ 已发布消息到 MQTT")

if __name__ == "__main__":
    asyncio.run(main())

