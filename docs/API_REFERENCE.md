# API Reference — MeoWise (后端 FastAPI + 前端 React)

说明：本文件对现有后端接口进行梳理，给出请求/响应结构与使用示例，并提出后续的接口规范优化建议。API 路径以后端配置中的 API_V1_PREFIX 为前缀，即 /api/v1。

## 版本与前缀
- API 前缀：/api/v1
- 认证方式：JWT Bearer Token，前端通过 /auth/token 获取并在后续请求中放在 Authorization: Bearer <token> 头中
- 文档入口：FastAPI 自动生成的 OpenAPI 文档可通过 /docs 进行探索，/redoc 进行中文化界面展示（如未禁用文档）。

## 统一的错误与返回约定（建议，当前实现以 HTTPException 为主，返回原始数据结构或自定义 Msg）
- 当前接口在错误时多为标准 HTTP 状态码和 detail 字段，建议统一改为一个可预测的返回结构，例如：
  ```json
  {
    "code": 0,            // 0 表示成功，非零表示错误
    "message": "OK",      // 描述信息
    "data": …             // 成功时的数据载荷
  }
  ```
- 该风格可通过引入通用响应模型实现统一封装（保持向后兼容性前提下逐步迁移）。

## 接口清单
以下为核心资源及其操作的汇总。每个端点的输入/输出参考 backend/schemas.py。

### 1) 身份与用户管理（/api/v1/auth）
- POST /auth/register
  - 描述：用户注册
  - 请求体（UserCreate）:
    - email: 邮箱
    - password: 密码
    - nickname: 昵称
    - avatar_id: 头像 ID
    - phone: 手机号
  - 响应：UserRead
  - 示例请求
    ```json
    {
      "email": "user@example.com",
      "password": "secret",
      "nickname": "MeowOwner",
      "avatar_id": 1,
      "phone": "1234567890"
    }
    ```
  - 示例响应：用户对象（包含 id、created_at、updated_at 等字段）

- POST /auth/token
  - 描述：通过邮箱（username）和密码获取 JWT
  - 参数：表单数据
    - username: 邮箱
    - password: 密码
  - 响应：Token（{ access_token, token_type }）
  - 示例请求：表单提交
    username=user@example.com&password=secret
  - 示例响应：{ "access_token": "...", "token_type": "bearer" }

- POST /auth/forgot-password
  - 描述：找回密码，返回重置 token
  - 请求体（ForgotPassword）: { email, phone }
  - 响应：{ reset_token: string, message: string }

- POST /auth/reset-password
  - 描述：重置密码
  - 请求体（ResetPassword）: { reset_token, new_password }
  - 响应：{ message: string }

- POST /auth/change-password
  - 描述：修改当前已登录用户的密码
  - 需要 Token（Bearer）
  - 请求体（ChangePassword）: { old_password, new_password }
  - 响应：{ message: string }

- GET /auth/me
  - 描述：获取当前登录用户信息
  - 认证：Bearer
  - 响应：UserRead

- PUT /auth/me
  - 描述：更新当前用户信息
  - 请求体（UserUpdate）: { nickname?, avatar_id?, phone? }
  - 响应：UserRead

- POST /auth/me/change_password
  - 描述：修改当前用户密码（路径风格命名建议统一）
  - 请求体：ChangePassword
  - 响应：Msg

> 备注：当前实现存在重复的 change_password 路由，需整理为单一路由并统一命名（建议 /auth/me/change_password 或 /auth/me/password）。

> Android 打包后前端在 WebView 运行时，需通过全局变量注入后端 API 基准地址（例如 window.__MEOWISE_API_BASE_URL = 'https://api.yourdomain/api/v1'），以确保相对路径 /api/v1/ 会正确定位到服务器端。

### 2) 设备管理（/api/v1/devices）
- GET /devices
  - 描述：获取当前用户绑定的设备列表
  - 响应：List[DeviceRead]

- POST /devices
  - 描述：绑定新设备
  - 请求体（DeviceCreate）: { device_sn, name }
  - 响应：DeviceRead
  - 注意：前端示例使用 mac_address，请在前后端契约中统一字段名，建议保持 device_sn 作为设备的全局唯一标识。

- GET /devices/{device_id}
  - 描述：获取设备详情
  - 响应：DeviceRead

- POST /devices/{device_id}/manual_feed
  - 描述：向设备发送手动投喂指令
  - 查询参数：amount_g
  - 响应：Msg

> 备注：手动喂食直接通过 MQTT 通道驱动设备，前端需要处理失败场景与超时

- GET /cats
  - 描述：获取当前用户绑定的猫咪
  - 响应：List[CatRead]

- POST /cats
  - 描述：新增猫咪
  - 请求体（CatCreate）: { name, standard_weight_kg, avatar_id }
  - 响应：CatRead

- PATCH /cats/{cat_id}
  - 描述：更新猫咪信息
  - 请求体（CatCreate）: { name, standard_weight_kg, avatar_id }
  - 响应：CatRead

- DELETE /cats/{cat_id}
  - 描述：删除猫咪
  - 响应：Msg

- POST /feeding_plans
  - 描述：创建新的喂食计划
  - 请求体（FeedingPlanCreate）: { device_id, name, time_of_day, days_of_week, amount_g }
  - 响应：FeedingPlanRead

- GET /feeding_plans
  - 描述：查询某设备的喂食计划
  - 查询参数：device_id
  - 响应：List[FeedingPlanRead]

- POST /feeding_plans/manual_feed
  - 描述：手动投喂（啟动投喂并记录）
  - 查询参数：device_id, amount_g
  - 响应：Msg

- GET /feeding_plans/activities
  - 描述：获取最近的活动记录
  - 查询参数：device_id, limit, activity_type（feeding/eating/all）
  - 响应：List[活动字典]（type/time/amount_g 等）

- PATCH /feeding_plans/{plan_id}
  - 描述：修改喂食计划的开关状态（is_enabled）
  - 请求体（FeedingPlanRead，建议改为 FeedingPlanUpdate）: { is_enabled }
  - 响应：FeedingPlanRead

- DELETE /feeding_plans/{plan_id}
  - 描述：删除喂食计划
  - 响应：Msg

### 5) 统计与报告（/api/v1/stats）
- GET /stats/report
  - 描述：获取喂食/进食统计报告
  - 查询参数：device_id, period（daily/weekly/monthly），可选 cat_id
  - 响应：{ stats: FeedingStats, daily_stats: Array[DailyStat] }

> 备注：统计口径需与前端页面的展示口径保持一致，daily_stats 的日期格式建议使用 ISO 8601 日期字符串。

## 约束与约定（当前实现中的问题与建议）
- 前后端字段命名不一致：前端在创建设备时发送 mac_address，而后端接口期望 device_sn。建议在契约上统一字段名，2 处一致后再上线。
- 路由参数设计：部分接口，例如 /feeding_plans/manual_feed 使用查询参数传递 device_id，建议对该资源使用路径参数规范化，例如 /feeding_plans/{device_id}/manual_feed，以保持 REST 风格的一致性，当前实现也可工作，但不如路径直观。
- 更新输入模型：如 /feeding_plans/{plan_id} 的 PATCH 使用了 FeedingPlanRead 作为请求体，推荐新增 FeedingPlanUpdate 的输入模型，明确仅暴露需要更新的字段（例如 is_enabled）。
- 账号/认证相关：建议统一错误响应结构，统一对未授权、权限不足、token 过期等情况返回统一字段和状态码。
- 重复路由：auth.py 中同名 change_password 函数重复定义，应重构为单一路由，统一命名风格。
- 安全性：当前 ACCESS_TOKEN_EXPIRE_MINUTES 设为 7 天，生产环境请考虑短期 token 配合 refresh token 方案。
- 文档自动化：当前文档会通过 FastAPI 自带的 /docs 自动生成，建议在 CI 中将 OpenAPI 规范导出为文档仓库产出（如 YAML/JSON），便于前端接口契约对照。

## 接口示例（简要）
- 登录示例请求（/api/v1/auth/token，表单数据）
  请求体：username=user@example.com, password=secret
  响应示例：{ "access_token": "...", "token_type": "bearer" }

- 获取我的设备（/api/v1/devices，Bearer）
  响应示例：[{"id":1, "device_sn":"ABC123", "name":"客厅喂食器", ...}]

- 创建喂食计划（/api/v1/feeding_plans，Bearer）
  请求体：{ "device_id": 1, "name": "早餐", "time_of_day": "08:00", "days_of_week": "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "amount_g": 20 }
  响应：{ "id": 10, "device_id": 1, "name": "早餐", "time_of_day": "08:00", "days_of_week": "Mon,...", "amount_g": 20, "is_enabled": true }

（以下省略其他逐条示例，文档以此为骨架扩展完整）

## 下一步计划
- 统一输入输出模型，新增 FeedingPlanUpdate、CatUpdate 等模型并修正对应路由。
- 将统一返回结构落地到所有接口，提升前后端契约的一致性。
- 修复前端的设备字段命名不一致问题，并在团队文档中固定契约字段。
- 将 OpenAPI 产出纳入 CI，以便在每次合并时自动更新文档库。

如果你愿意，我可以进一步把以上草案落地为实际文档与接口变更清单，并在代码中逐步实现。也可以先从生成一份可执行的 API_REFERENCE.md 开始。 
