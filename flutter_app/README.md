## MeoWise Flutter APP

基于 Flutter 的 MeoWise 智能喂食 APP，采用莫兰迪色系设计与 GetWidget 组件库，包含登录、首页设备列表、设备详情、进食报告等页面。

### 目录结构

- `lib/main.dart`：应用入口，配置路由与全局主题
- `lib/ui/meowise_theme.dart`：莫兰迪色系主题与组件样式
- `lib/api/api_client.dart`：与后端 FastAPI 通信的封装（Dio + SharedPreferences）
- `lib/screens/login_page.dart`：登录页
- `lib/screens/home_page.dart`：设备列表页
- `lib/screens/device_detail_page.dart`：设备详情与手动放粮
- `lib/screens/feeding_report_page.dart`：进食报告（可扩展为折线图）

### 环境要求

- Flutter SDK 3.x
- 已安装至少一个运行设备：
  - Android 模拟器 / 真机
  - 或 Chrome（Web）/ Windows 桌面

### 与后端通信配置

后端默认运行在本机 `8000` 端口，对应基础地址：`http://127.0.0.1:8000/api/v1`。

在 `lib/api/api_client.dart` 中通过 `ApiConfig.baseUrl` 配置：

- Android 模拟器：
  - `static const String baseUrl = 'http://10.0.2.2:8000/api/v1';`
- Web / 桌面 / iOS 模拟器：
  - `static const String baseUrl = 'http://127.0.0.1:8000/api/v1';`

请根据实际运行平台切换或通过构建配置注入不同的 Base URL。

### 本地运行步骤

1. 安装依赖：

   ```bash
   cd flutter_app

   flutter pub get
   ```

2. 启动后端（参考仓库根目录 `README.md` 中的 FastAPI 启动步骤），确保能通过浏览器访问 `http://127.0.0.1:8000/docs`。

3. 启动 APP：

- Android 模拟器：
  ```bash
  flutter run
  ```
- Chrome Web：
  ```bash
  flutter run -d chrome
  ```

登录/注册、设备列表、设备详情、进食报告相关接口的约定详见根目录 `docs/api_spec.md`。
