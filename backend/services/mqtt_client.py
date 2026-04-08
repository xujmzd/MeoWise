import asyncio
import json
import ssl
import aiomqtt
from config import settings
from database import SessionLocal
import models
from datetime import datetime, timezone

# 创建 SSL 上下文，用于安全连接（端口 8883）
ssl_ctx = ssl.create_default_context()


def parse_dt(value):
    """把 ISO 格式字符串转换成 datetime，如果为空或格式错误则返回 None"""
    if not value:
        return None
    try:
        if value.endswith('Z'):
            value = value[:-1] + '+00:00'
        return datetime.fromisoformat(value)
    except Exception:
        return None


class MqttService:
    """
    封装 EMQX Cloud MQTT 客户端。
    - publish(): 短连接，发送指令到设备（例如手动放粮）
    - listen(): 长连接，订阅设备上报的状态消息，写入数据库
    
    支持的消息类型：
    1. status - 设备状态上报（食盆重量、余量、信号强度）
    2. feeding_event - 喂食事件（手动/定时投喂完成）
    3. eating_session - 进食会话（猫咪进食开始/结束）
    4. cat_weight - 猫咪体重测量
    """

    def __init__(self) -> None:
        self._host = settings.MQTT_BROKER_HOST
        self._port = settings.MQTT_BROKER_PORT
        self._username = settings.MQTT_USERNAME
        self._password = settings.MQTT_PASSWORD
        self._base_topic = settings.MQTT_BASE_TOPIC.rstrip("/")

    async def publish(self, device_sn: str, sub_topic: str, payload: dict) -> None:
        """
        发布指令到设备，例如手动放粮。
        每次调用都会建立一个短连接，发送完毕后关闭。
        
        发布主题格式：{base_topic}/{device_sn}/{sub_topic}
        例如：meowise/ABC123456/feed/manual
        """
        topic = f"{self._base_topic}/{device_sn}/{sub_topic}"
        use_ssl = self._port == 8883

        async with aiomqtt.Client(
            self._host,
            port=self._port,
            username=self._username,
            password=self._password,
            tls_context=ssl_ctx if use_ssl else None
        ) as client:
            await client.publish(topic, json.dumps(payload))

    async def _match_cat_by_weight(self, db, user_id: int, cat_weight: float):
        """
        根据测量体重匹配猫咪
        找到与标准体重最接近的猫咪
        """
        cats = db.query(models.Cat).filter_by(user_id=user_id).all()
        if not cats:
            return None
        return min(cats, key=lambda c: abs(c.standard_weight_kg - cat_weight))

    async def _process_status(self, db, device: models.Device, payload: dict):
        """处理设备状态上报"""
        if "bowl_weight_g" in payload:
            device.bowl_weight_g = float(payload["bowl_weight_g"])
        if "silo_remaining_pct" in payload:
            device.silo_remaining_pct = float(payload["silo_remaining_pct"])
        if "signal_strength" in payload:
            device.signal_strength = int(payload["signal_strength"])
        db.add(device)

    async def _process_feeding_event(self, db, device: models.Device, payload: dict):
        """
        处理投喂事件
        设备完成一次投喂后上报
        """
        event_type = payload.get("event_type", "manual")  # manual 或 scheduled
        amount_g = float(payload.get("amount_g", 0))
        feeding_time = parse_dt(payload.get("timestamp")) or datetime.now(timezone.utc)

        feeding = models.Feeding(
            user_id=device.user_id,
            device_id=device.id,
            feeding_time=feeding_time,
            amount_g=amount_g,
            type=event_type,
        )
        db.add(feeding)
        print(f"[MQTT] 投喂事件已记录: device={device.device_sn}, amount={amount_g}g, type={event_type}")

    async def _process_eating_session(self, db, device: models.Device, payload: dict):
        """
        处理进食会话
        猫咪开始进食和结束进食时上报
        """
        cat_weight = payload.get("cat_weight_kg")
        if not cat_weight:
            print("[MQTT] 进食会话缺少 cat_weight_kg，无法匹配猫咪")
            return

        matched_cat = await self._match_cat_by_weight(db, device.user_id, float(cat_weight))
        if not matched_cat:
            print(f"[MQTT] 未找到匹配的猫咪，体重: {cat_weight}kg")
            return

        start_time = parse_dt(payload.get("start_time"))
        end_time = parse_dt(payload.get("end_time"))
        eaten_g = float(payload.get("eaten_g", 0))

        if not start_time:
            print("[MQTT] 进食会话缺少 start_time")
            return

        eating = models.Eating(
            user_id=device.user_id,
            device_id=device.id,
            cat_id=matched_cat.id,
            start_time=start_time,
            end_time=end_time or start_time,
            eaten_g=eaten_g,
        )
        db.add(eating)
        print(f"[MQTT] 进食记录已记录: cat={matched_cat.name}, eaten={eaten_g}g")

    async def _process_cat_weight(self, db, device: models.Device, payload: dict):
        """
        处理猫咪体重测量
        通过智能体重秤测量猫咪体重
        """
        cat_weight = payload.get("cat_weight_kg")
        timestamp = parse_dt(payload.get("timestamp"))
        
        if not cat_weight:
            return

        matched_cat = await self._match_cat_by_weight(db, device.user_id, float(cat_weight))
        if matched_cat:
            # 可以在这里添加体重记录到其他表的逻辑
            print(f"[MQTT] 猫咪体重测量: cat={matched_cat.name}, weight={cat_weight}kg")

    async def listen(self) -> None:
        """
        长连接订阅设备状态消息。
        
        订阅的主题格式：
        - {base_topic}/+/status - 设备状态上报
        - {base_topic}/+/event - 喂食事件
        - {base_topic}/+/eating - 进食会话
        - {base_topic}/+/weight - 体重测量
        
        设备端会通过 MQTT 上报各类消息，后端解析并写入数据库。
        """
        use_ssl = self._port == 8883

        async with aiomqtt.Client(
                self._host,
                port=self._port,
                username=self._username,
                password=self._password,
                tls_context=ssl_ctx if use_ssl else None
        ) as client:
            # 订阅所有设备的相关主题
            await client.subscribe(f"{self._base_topic}/+/status")
            await client.subscribe(f"{self._base_topic}/+/event")
            await client.subscribe(f"{self._base_topic}/+/eating")
            await client.subscribe(f"{self._base_topic}/+/weight")
            print(f"[MQTT] 已订阅主题: {self._base_topic}/+/status, +/event, +/eating, +/weight")

            async for message in client.messages:
                try:
                    topic = str(message.topic)
                    payload = json.loads(message.payload.decode())
                    
                    # 从主题中提取 device_sn
                    # 格式: {base_topic}/{device_sn}/{msg_type}
                    topic_parts = topic.split("/")
                    if len(topic_parts) < 3:
                        print(f"[MQTT] 无效主题格式: {topic}")
                        continue
                    
                    device_sn = topic_parts[-2]
                    msg_type = topic_parts[-1]

                    db = SessionLocal()
                    try:
                        device = db.query(models.Device).filter_by(device_sn=device_sn).first()
                        if not device:
                            print(f"[MQTT] 设备未找到: {device_sn}")
                            continue

                        # 根据消息类型处理
                        if msg_type == "status":
                            await self._process_status(db, device, payload)
                        elif msg_type == "event":
                            await self._process_feeding_event(db, device, payload)
                        elif msg_type == "eating":
                            await self._process_eating_session(db, device, payload)
                        elif msg_type == "weight":
                            await self._process_cat_weight(db, device, payload)
                        else:
                            print(f"[MQTT] 未知消息类型: {msg_type}")

                        db.commit()
                    except Exception as e:
                        db.rollback()
                        print(f"[MQTT] 处理消息时出错: {e}")
                    finally:
                        db.close()

                except json.JSONDecodeError as e:
                    print(f"[MQTT] JSON 解析错误: {e}")
                except Exception as e:
                    print(f"[MQTT] 消息处理错误: {e}")


# 单例实例
mqtt_service = MqttService()
