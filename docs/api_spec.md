## MeoWise 接口规范

> 说明：本文件描述 **前端 ⇄ 后端 REST 接口** 以及 **后端 ⇄ MQTT ⇄ 设备** 之间的接口约定，作为前后端与嵌入式开发协同的单一真相（Single Source of Truth）。

---

### 1. 通用约定

- **基础地址（Backend Base URL）**
  - 开发环境：`http://127.0.0.1:8000/api/v1`
  - Android 模拟器：`http://10.0.2.2:8000/api/v1`
- **认证方式**
  - 登录成功后返回 JWT：`access_token`
  - 所有需要登录的接口都要求 Header：
    - `Authorization: Bearer <access_token>`
- **通用响应结构**
  - 成功：根据各接口定义返回 JSON
  - 失败：FastAPI 标准错误结构，含 `detail` 字段

---

### 2. 认证与用户接口（Auth & Users）

#### 2.1 注册

- `POST /auth/register`
- Request Body（JSON）：
  ```json
  {
    "email": "user@example.com",
    "password": "123456"
  }
  ```
- Response（200）：
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "created_at": "...",
    "updated_at": "...",
    "nickname": null,
    "avatar_url": null
  }
  ```

#### 2.2 登录

- `POST /auth/token`
- Content-Type：`application/x-www-form-urlencoded`
- Request Body：
  - `username`：邮箱
  - `password`：密码
- Response（200）：
  ```json
  {
    "access_token": "JWT_TOKEN",
    "token_type": "bearer"
  }
  ```

#### 2.3 获取当前用户

- `GET /users/me`
- Header：`Authorization: Bearer <token>`
- Response（200）：
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "created_at": "...",
    "updated_at": "...",
    "nickname": "铲屎官小王",
    "avatar_url": "https://example.com/avatar.png"
  }
  ```

#### 2.4 更新当前用户资料

- `PATCH /users/me`
- Header：`Authorization: Bearer <token>`
- Request Body（可部分字段）：
  ```json
  {
    "nickname": "铲屎官小王",
    "avatar_url": "https://example.com/avatar.png"
  }
  ```

#### 2.5 修改密码

- `POST /users/me/change_password`
- Header：`Authorization: Bearer <token>`
- Request Body：
  ```json
  {
    "old_password": "旧密码",
    "new_password": "新密码"
  }
  ```
- Response：
  ```json
  { "message": "Password updated successfully" }
  ```

---

### 3. 猫咪管理接口（Cats）

#### 3.1 获取猫咪列表

- `GET /cats/`
- Header：`Authorization: Bearer <token>`
- Response：
  ```json
  [
    {
      "id": 1,
      "name": "小鱼干",
      "standard_weight_kg": 4.2
    }
  ]
  ```

#### 3.2 新增猫咪

- `POST /cats/`
- Header：`Authorization: Bearer <token>`
- Request Body：
  ```json
  {
    "name": "小鱼干",
    "standard_weight_kg": 4.2
  }
  ```

#### 3.3 更新猫咪

- `PATCH /cats/{cat_id}`
- Header：`Authorization: Bearer <token>`
- Request Body：同新增

#### 3.4 删除猫咪

- `DELETE /cats/{cat_id}`
- Header：`Authorization: Bearer <token>`
- Response：
  ```json
  { "message": "Cat deleted" }
  ```

---

### 4. 设备与喂食计划接口（Devices & Feedings）

#### 4.1 获取设备列表

- `GET /devices/`
- Header：`Authorization: Bearer <token>`
- Response：
  ```json
  [
    {
      "id": 1,
      "device_sn": "DEVICE_SN_001",
      "name": "客厅喂食器",
      "bowl_weight_g": 35,
      "silo_remaining_pct": 80,
      "signal_strength": 75
    }
  ]
  ```

#### 4.2 绑定设备

- `POST /devices/`
- Header：`Authorization: Bearer <token>`
- Request Body：
  ```json
  {
    "device_sn": "DEVICE_SN_001",
    "name": "客厅喂食器"
  }
  ```

#### 4.3 获取设备详情

- `GET /devices/{device_id}`
- Header：`Authorization: Bearer <token>`
- Response：同单个 Device 对象

#### 4.4 手动放粮

- `POST /devices/{device_id}/manual_feed`
- Header：`Authorization: Bearer <token>`
- Query 参数：
  - `amount_g`: 浮点数，单位 g
- Response：
  ```json
  { "message": "Feed command sent" }
  ```

#### 4.5 获取设备定时计划列表

- `GET /feedings/devices/{device_id}/plans`
- Header：`Authorization: Bearer <token>`
- Response：`FeedingPlanRead[]`

#### 4.6 创建定时计划

- `POST /feedings/devices/{device_id}/plans`
- Header：`Authorization: Bearer <token>`
- Request Body：
  ```json
  {
    "name": "早餐",
    "time_of_day": "08:00:00",
    "days_of_week": "0,1,2,3,4,5,6",
    "amount_g": 20,
    "is_enabled": true
  }
  ```

#### 4.7 更新定时计划

- `PATCH /feedings/plans/{plan_id}`

#### 4.8 删除定时计划

- `DELETE /feedings/plans/{plan_id}`

---

### 5. 进食报告接口（Stats）

#### 5.1 会话列表

- `GET /stats/devices/{device_id}/sessions`
- 用于前端列表展示或图表原始数据。

#### 5.2 进食报告

- `GET /stats/devices/{device_id}/report/{period}`
- `period`：`daily` 或 `weekly`
- Response：
  ```json
  {
    "period": "daily",
    "date": "...",
    "stats": {
      "total_sessions": 3,
      "total_dispensed_g": 60,
      "total_eaten_g": 55,
      "avg_session_duration_sec": 120
    },
    "sessions": [
      {
        "id": 1,
        "device_id": 1,
        "start_time": "...",
        "end_time": "...",
        "dispensed_g": 20,
        "eaten_g": 18
      }
    ]
  }
  ```

---

### 6. MQTT 与嵌入式设备协议约定

#### 6.1 Broker 与 Topic 约定

- Broker：
  - Host：`settings.MQTT_BROKER_HOST`
  - Port：`settings.MQTT_BROKER_PORT`
  - Username：`settings.MQTT_USERNAME`
  - Password：`settings.MQTT_PASSWORD`
- 基础 Topic 前缀：
  - `settings.MQTT_BASE_TOPIC`，默认 `"meowise"`，末尾不带 `/`
- 完整下行 Topic（后端 → 设备）：
  - 手动放粮：
    - `"{base_topic}/{device_sn}/feed/manual"`
    - 示例（使用默认前缀且设备 SN 为 `ABC123`）：
      - `meowise/ABC123/feed/manual`

#### 6.2 手动放粮指令 Payload（JSON）

当用户在 App 触发“手动放粮”时，后端会通过 MQTT 发送如下 JSON：

```json
{
  "command": "DISPENSE",
  "amount_g": 20,
  "from": "app",
  "user_id": 1
}
```

- `command`：命令类型，当前固定为 `"DISPENSE"`
- `amount_g`：需要投放的克数（浮点数）
- `from`：来源，当前为 `"app"`
- `user_id`：在平台侧的用户 ID

**设备侧约定建议：**

- 设备订阅 Topic：`meowise/{device_sn}/feed/#`
- 收到 `DISPENSE` 指令后：
  - 按 `amount_g` 控制电机投放粮食；
  - 可选：在完成投放后向上报 Topic（例如 `meowise/{device_sn}/feed/ack`）发送确认和实际投放结果（该上报逻辑需设备与后端后续共同扩展）。

---

### 7. 前端调用规范（Flutter）

- 基础 URL：
  - Android 模拟器：`http://10.0.2.2:8000/api/v1`
  - Web/桌面/iOS 模拟器：`http://127.0.0.1:8000/api/v1`
- 统一使用 `Authorization: Bearer <token>` 头（在 `ApiClient` 中已经封装）。
- 已封装的主要方法（Dart）：
  - `register(email, password)` → `/auth/register`
  - `login(email, password)` → `/auth/token`
  - `getDevices()` / `bindDevice(...)` / `manualFeed(...)`
  - `getFeedingPlans(...)` / `createFeedingPlan(...)` / `updateFeedingPlan(...)` / `deleteFeedingPlan(...)`
  - `getFeedingSessions(...)` / `getFeedingReport(...)`
  - 个人中心 & 猫咪管理相关方法可在现有 `ApiClient` 基础上继续补充。

