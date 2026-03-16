## MeoWise - 物联网宠物智能喂食系统

本项目是一个完整的 IoT 宠物智能喂食解决方案示例，包含：

- **APP 前端**：Flutter（UI 组件库：GetWidget / Flexfold）
- **后端**：Python（FastAPI，Serverless 友好结构）
- **数据库**：Supabase（基于 Postgres 的托管数据库）
- **MQTT 服务**：EMQX Cloud
- **托管**：Vercel（Serverless Functions + 静态资源）

### 功能概述

- **用户系统**：注册、登录（JWT）、用户信息管理
- **设备管理**：蓝牙辅助配网（APP 端）、设备绑定/解绑、设备状态展示
- **静态录入**：按猫咪维度录入姓名和标准体重
- **实时状态**：当前食盆克数、粮桶余量百分比、设备信号强度
- **手动放粮**：滑动解锁按钮防误触，经后端转发 MQTT 指令到设备
- **定时放粮**：创建/修改/删除定时喂食计划
- **进食报告**：按日 / 周统计进食次数、总克数、平均进食时长等

### 仓库结构（初始）

- `backend/`：FastAPI 后端
- `flutter_app/`：Flutter APP 示例结构
- `PRD.docx`：产品需求文档（原始）

后端与前端代码都以“可直接扩展”的骨架形式提供，你可以在此基础上接入真实硬件 SDK、Supabase/EMQX 云服务以及生产级鉴权策略。


### 1. 前后端启动 & 通信现状

* 后端启动问题已解决：
* 默认数据库已改为本地 SQLite：backend/config.py 中 DATABASE_URL = "sqlite:///./meowise.db"，不依赖外部 Postgres 即可启动。
* 使用命令即可在本地跑起 FastAPI：

  **    **cd** backend

  **    **python** **-m** **venv** .venv

  **    **.venv\Scripts\activate**  

  **    **pip** **install** **-r** requirements.txt

  **    **cd** ..

  **    **uvicorn** **backend.main:app** **--reload** **--host** **0.0.0.0** **--port** 8000
* Swagger 接口文档自动暴露在：http://127.0.0.1:8000/docs
* 前端可以正常编译 & 与后端通信：
* flutter analyze 只有一些无伤大雅的 warning（未使用 import / const / withOpacity 过期提示），没有错误。
* 你只需要根据运行平台调整 lib/api/api_client.dart 的 ApiConfig.baseUrl：
* Android 模拟器：http://10.0.2.2:8000/api/v1
* Web/桌面：http://127.0.0.1:8000/api/v1
* 启动命令示例：

  **    **cd** **flutter_app

  **    **flutter** **pub** **get

  **    **flutter** **run**           **# Android 模拟器

  **    **flutter** **run** **-d** **chrome** **# Web
* 前端所有接口（注册、登录、设备、计划、报告等）都通过 ApiClient 统一走 baseUrl，只要后端在 8000 端口跑着，前后端即可正常通信。

### 2. 本地接口文档（REST + MQTT + 嵌入式）

* 已在项目中新增 本地接口文档：docs/api_spec.md，内容包括：
* 前端 ⇄ 后端 REST 接口标准：
* 用户注册 /auth/register、登录 /auth/token、当前用户 /users/me、更新资料 /users/me、改密 /users/me/change_password；
* 猫咪管理 /cats/ 的增删改查；
* 设备 /devices/ 列表、绑定、详情、手动放粮 /devices/{id}/manual_feed；
* 喂食计划 /feedings/devices/{device_id}/plans 的增查改删；
* 进食会话与报告 /stats/devices/{device_id}/sessions、/stats/devices/{device_id}/report/{period}。
* 后端 ⇄ MQTT ⇄ 嵌入式接口标准（来自 backend/services/mqtt_client.py 与业务约定）：
* Broker 配置字段（MQTT_BROKER_HOST / PORT / USERNAME / PASSWORD / MQTT_BASE_TOPIC）；
* Topic 规范：{base_topic}/{device_sn}/feed/manual，默认前缀为 meowise；
* 手动放粮下行 payload 示例：

  **      {**

  **        **"command"**: **"DISPENSE"**,**

  **        **"amount_g"**: **20**,**

  **        **"from"**: **"app"**,**

  **        **"user_id"**: **1

  **      }**
* 对设备侧的建议（订阅 meowise/{device_sn}/feed/#，按 amount_g 控制电机，可选上报 ack topic 等）。
* 前端调用规范：
* 统一使用 Authorization: Bearer `<token>` 头；
* 已封装的 ApiClient 方法与对应的后端 URL 映射说明。

你可以直接在 IDE 中打开 docs/api_spec.md，它就是你要的“本地保存的接口文档”。
