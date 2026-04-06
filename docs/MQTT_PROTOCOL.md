# MeoWise MQTT 通信协议文档

## 1. 概述

本文档描述了 MeoWise 智能宠物喂食系统中，设备与后端服务器之间的 MQTT 通信协议。设备通过 MQTT 向后端上报状态和事件，后端通过 MQTT 向设备发送控制指令。

### 1.1 通信架构

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   智能喂食器     │         │   MQTT Broker   │         │   后端服务      │
│   (设备端)       │◄───────►│   (EMQX Cloud)  │◄───────►│   (FastAPI)     │
│                 │         │                 │         │                 │
│ - 食盆称重      │         │ - 消息路由      │         │ - 消息处理      │
│ - 投喂控制      │         │ - 消息持久化    │         │ - 数据持久化    │
│ - 猫咪识别      │         │ - 在线状态      │         │ - 业务逻辑      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### 1.2 通信方式

| 方向 | 说明 | 协议 |
|------|------|------|
| 后端 → 设备 | 发送控制指令（如手动投喂） | QoS 0/1 |
| 设备 → 后端 | 上报状态和事件 | QoS 1 |

### 1.3 基础配置

| 参数 | 说明 | 示例 |
|------|------|------|
| Broker 地址 | EMQX Cloud 实例地址 | `xxxxxx.emqxsl.cn` |
| 端口 | 非加密 1883 / 加密 8883 | 1883 / 8883 |
| 用户名 | MQTT 认证用户名 | `admin` |
| 密码 | MQTT 认证密码 | `password123` |
| Topic 前缀 | 所有主题的前缀 | `meowise` |

---

## 2. Topic 主题规范

### 2.1 主题命名规则

```
{base_topic}/{device_sn}/{message_type}
```

- `base_topic`: 配置的主题前缀（默认 `meowise`）
- `device_sn`: 设备序列号，唯一标识一台设备
- `message_type`: 消息类型（status / event / eating / weight / feed）

### 2.2 主题列表

| 主题模式 | 方向 | 说明 |
|----------|------|------|
| `meowise/{device_sn}/status` | 设备 → 服务器 | 设备状态上报 |
| `meowise/{device_sn}/event` | 设备 → 服务器 | 投喂事件通知 |
| `meowise/{device_sn}/eating` | 设备 → 服务器 | 进食会话记录 |
| `meowise/{device_sn}/weight` | 设备 → 服务器 | 猫咪体重测量 |
| `meowise/{device_sn}/feed/manual` | 服务器 → 设备 | 手动投喂指令 |
| `meowise/{device_sn}/feed/scheduled` | 服务器 → 设备 | 定时投喂指令 |

---

## 3. 消息格式

### 3.1 设备状态上报 (`status`)

设备定期或在状态变化时上报当前状态。

**Topic:** `meowise/{device_sn}/status`

**方向:** 设备 → 服务器

**消息示例:**
```json
{
  "device_sn": "ABC123456789",
  "bowl_weight_g": 45.5,
  "silo_remaining_pct": 78.5,
  "signal_strength": -45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| device_sn | string | 是 | 设备序列号 |
| bowl_weight_g | float | 否 | 食盆当前重量（克） |
| silo_remaining_pct | float | 否 | 粮仓剩余百分比（0-100） |
| signal_strength | int | 否 | WiFi 信号强度（dBm） |
| timestamp | string | 否 | 时间戳（ISO 8601 格式） |

**后端处理:**
- 更新 `devices` 表中的实时状态字段
- 不创建新的数据库记录

---

### 3.2 投喂事件通知 (`event`)

设备完成一次投喂操作后上报。

**Topic:** `meowise/{device_sn}/event`

**方向:** 设备 → 服务器

**消息示例:**
```json
{
  "device_sn": "ABC123456789",
  "event_type": "manual",
  "amount_g": 10.0,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| device_sn | string | 是 | 设备序列号 |
| event_type | string | 是 | 事件类型：`manual`（手动）、`scheduled`（定时） |
| amount_g | float | 是 | 投喂量（克） |
| timestamp | string | 是 | 投喂时间（ISO 8601 格式） |

**后端处理:**
- 在 `feedings` 表中创建一条新的投喂记录
- 关联设备和用户

---

### 3.3 进食会话记录 (`eating`)

设备检测到猫咪进食后上报完整会话。

**Topic:** `meowise/{device_sn}/eating`

**方向:** 设备 → 服务器

**消息示例:**
```json
{
  "device_sn": "ABC123456789",
  "cat_weight_kg": 4.2,
  "start_time": "2024-01-15T10:30:00Z",
  "end_time": "2024-01-15T10:35:00Z",
  "eaten_g": 8.5
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| device_sn | string | 是 | 设备序列号 |
| cat_weight_kg | float | 是 | 进食时测量的猫咪体重（千克），用于匹配猫咪 |
| start_time | string | 是 | 进食开始时间（ISO 8601 格式） |
| end_time | string | 是 | 进食结束时间（ISO 8601 格式） |
| eaten_g | float | 是 | 实际进食量（克） |

**后端处理:**
- 根据 `cat_weight_kg` 匹配最接近的猫咪（与 `standard_weight_kg` 差值最小）
- 在 `eatings` 表中创建一条新的进食记录
- 如果没有匹配的猫咪，记录日志并忽略该消息

---

### 3.4 猫咪体重测量 (`weight`)

通过智能体重秤测量猫咪体重后上报。

**Topic:** `meowise/{device_sn}/weight`

**方向:** 设备 → 服务器

**消息示例:**
```json
{
  "device_sn": "ABC123456789",
  "cat_weight_kg": 4.3,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| device_sn | string | 是 | 设备序列号 |
| cat_weight_kg | float | 是 | 测量的猫咪体重（千克） |
| timestamp | string | 是 | 测量时间（ISO 8601 格式） |

**后端处理:**
- 根据 `cat_weight_kg` 匹配猫咪
- 可用于后续健康数据分析（当前仅记录日志）

---

### 3.5 手动投喂指令 (`feed/manual`)

服务器向设备发送手动投喂指令。

**Topic:** `meowise/{device_sn}/feed/manual`

**方向:** 服务器 → 设备

**消息示例:**
```json
{
  "command": "DISPENSE",
  "amount_g": 10.0,
  "from": "app",
  "user_id": 123
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| command | string | 是 | 指令类型，固定为 `DISPENSE` |
| amount_g | float | 是 | 投喂量（克） |
| from | string | 是 | 指令来源：`app`（APP）/ `web`（网页） |
| user_id | int | 否 | 发起操作的用户 ID |

**设备响应:**
- 设备收到后执行投喂
- 完成后通过 `event` 主题上报投喂结果

---

### 3.6 定时投喂指令 (`feed/scheduled`)

服务器向设备发送定时投喂指令。

**Topic:** `meowise/{device_sn}/feed/scheduled`

**方向:** 服务器 → 设备

**消息示例:**
```json
{
  "command": "DISPENSE",
  "amount_g": 20.0,
  "plan_id": 45,
  "scheduled_time": "2024-01-15T08:00:00Z"
}
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| command | string | 是 | 指令类型，固定为 `DISPENSE` |
| amount_g | float | 是 | 投喂量（克） |
| plan_id | int | 否 | 喂食计划 ID |
| scheduled_time | string | 否 | 计划执行时间（ISO 8601 格式） |

**设备响应:**
- 设备收到后执行投喂
- 完成后通过 `event` 主题上报投喂结果（event_type: "scheduled"）

---

## 4. 数据库映射

### 4.1 feedings 表（投喂记录）

由 `event` 消息创建。

| 字段 | 来源 | 说明 |
|------|------|------|
| id | 自动生成 | 主键 |
| user_id | device.user_id | 设备所属用户 |
| device_id | device.id | 设备 ID |
| feeding_time | payload.timestamp | 投喂时间 |
| amount_g | payload.amount_g | 投喂量 |
| type | payload.event_type | 投喂类型 |

### 4.2 eatings 表（进食记录）

由 `eating` 消息创建。

| 字段 | 来源 | 说明 |
|------|------|------|
| id | 自动生成 | 主键 |
| user_id | device.user_id | 设备所属用户 |
| device_id | device.id | 设备 ID |
| cat_id | 匹配的猫咪 | 根据体重匹配 |
| start_time | payload.start_time | 进食开始时间 |
| end_time | payload.end_time | 进食结束时间 |
| eaten_g | payload.eaten_g | 实际进食量 |

### 4.3 devices 表（设备状态）

由 `status` 消息更新。

| 字段 | 来源 | 说明 |
|------|------|------|
| bowl_weight_g | payload.bowl_weight_g | 食盆重量 |
| silo_remaining_pct | payload.silo_remaining_pct | 粮仓余量 |
| signal_strength | payload.signal_strength | 信号强度 |

---

## 5. 错误处理

### 5.1 设备未找到

如果设备序列号在数据库中不存在：
- 后端记录日志
- 不处理该消息
- 不返回错误响应

### 5.2 猫咪匹配失败

如果无法根据体重匹配到猫咪：
- 在进食会话处理中，记录日志
- 不创建进食记录
- 建议设备端增加猫咪识别机制（如 RFID）

### 5.3 JSON 解析错误

如果消息格式无效：
- 记录错误日志
- 忽略该消息
- 不影响后续消息处理

---

## 6. 示例代码

### 6.1 设备端（Python 示例）

```python
import paho.mqtt.client as mqtt
import json
from datetime import datetime

BROKER = "xxxxxx.emqxsl.cn"
PORT = 8883
USERNAME = "admin"
PASSWORD = "password123"
DEVICE_SN = "ABC123456789"
BASE_TOPIC = "meowise"

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # 订阅控制指令
    client.subscribe(f"{BASE_TOPIC}/{DEVICE_SN}/feed/#")

def on_message(client, userdata, msg):
    payload = json.loads(msg.payload.decode())
    print(f"Received: {msg.topic} -> {payload}")
    
    # 处理投喂指令
    if "feed" in msg.topic:
        amount = payload.get("amount_g", 10)
        # 执行投喂...
        
        # 上报投喂事件
        event = {
            "device_sn": DEVICE_SN,
            "event_type": "manual",
            "amount_g": amount,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        client.publish(f"{BASE_TOPIC}/{DEVICE_SN}/event", json.dumps(event))

client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.on_connect = on_connect
client.on_message = on_message
client.tls_set()
client.connect(BROKER, PORT, 60)
client.loop_forever()
```

### 6.2 设备端状态上报（C++ 示例）

```cpp
#include <PubSubClient.h>
#include <ArduinoJson.h>

void publishStatus(float bowlWeight, float siloRemaining, int signalStrength) {
    StaticJsonDocument<256> doc;
    doc["device_sn"] = "ABC123456789";
    doc["bowl_weight_g"] = bowlWeight;
    doc["silo_remaining_pct"] = siloRemaining;
    doc["signal_strength"] = signalStrength;
    doc["timestamp"] = getISOTimestamp();
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    String topic = String("meowise/") + DEVICE_SN + "/status";
    client.publish(topic.c_str(), buffer);
}
```

---

## 7. 安全建议

1. **使用 TLS 加密**: 生产环境必须使用端口 8883 和 TLS 连接
2. **认证机制**: 配置 MQTT 用户名和密码，不要使用匿名访问
3. **Topic 权限**: 为每个设备配置独立的 Topic 权限，防止越权访问
4. **设备认证**: 考虑使用设备证书进行双向认证
5. **消息验证**: 后端应对所有消息进行字段验证，防止异常数据

---

## 8. 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-15 | 初始版本 |
