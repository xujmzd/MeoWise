# GitHub 上传与部署指南

## 一、上传到 GitHub

### 步骤 1: 创建 GitHub 仓库
1. 访问 [github.com](https://github.com) 登录
2. 点击右上角 "+" → "New repository"
3. 填写：
   - Repository name: `meowise`
   - Description: 喵食记 - 智能宠物喂食器
   - 选择 **Public** 或 **Private**
4. 点击 "Create repository"（不要勾选任何初始化选项）

### 步骤 2: 本地初始化并推送

在项目目录执行：

```bash
cd Z:\CodeDown\PythonProjects\MeoWise

# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件（除了 .gitignore 指定的）
git add .

# 3. 创建提交
git commit -m "Initial commit: MeoWise 智能喂食器 v1.0"

# 4. 关联远程仓库（将 your_username 替换为你的 GitHub 用户名）
git remote add origin https://github.com/your_username/meowise.git

# 5. 推送代码
git push -u origin main
# 或者如果是 master 分支
# git push -u origin master
```

---

## 二、部署到 Vercel

### 1. 部署后端

```bash
# 进入后端目录
cd backend

# 登录 Vercel（如果没有）
# npm i -g vercel
vercel login

# 部署（按提示操作）
vercel --prod
```

**重要：在 Vercel Dashboard 配置环境变量**
1. 进入 Vercel Dashboard → 你的后端项目 → Settings → Environment Variables
2. 添加以下变量：

| 变量名 | 值（示例）|
|--------|----------|
| DATABASE_URL | `postgresql://postgres:5geCQPUQdYEDu5wT@db.ajldgyrnapgxhsomfhku.supabase.co:5432/postgres` |
| SECRET_KEY | `随机字符串（至少32位）`rV2fV1nX5iV0bU5jA9eD7qO0dG4mY5zC |

### 2. 部署前端

```bash
# 进入前端目录
cd MeoWise_Web

# 修改 API 地址为你的后端地址
# 编辑 .env 文件，将 VITE_API_BACKEND_URL 改为你的后端域名
# 例如：VITE_API_BACKEND_URL=https://meowise-api.vercel.app

# 部署
vercel --prod
```

---

## 三、打包 Android APK

### 方式 1: 使用 Android Studio（推荐）

```bash
# 1. 确保已安装 Android Studio 和 JDK

# 2. 打开终端，进入项目目录
cd Z:\CodeDown\PythonProjects\MeoWise\MeoWise_Web

# 3. 添加 Android 平台（如还没有）
npx cap add android

# 4. 同步代码到 Android
npx cap sync android

# 5. 在 Android Studio 中打开
npx cap open android
```

在 Android Studio 中：
1. 点击 **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. 等待构建完成
3. APK 位置：`android\app\build\outputs\apk\debug\app-debug.apk`

### 方式 2: 命令行打包

```bash
# 进入 Android 目录
cd Z:\CodeDown\PythonProjects\MeoWise\MeoWise_Web\android

# Mac/Linux
./gradlew assembleDebug

# Windows
gradlew.bat assembleDebug
```

---

## 四、Android 连接生产后端

部署完成后，需要修改前端 API 地址：

### 方法 1: 修改代码后重新构建

编辑 `MeoWise_Web/src/main.tsx`：
```javascript
// 修改这行
baseUrl = 'https://your-vercel-backend.vercel.app';
```

然后重新构建并打包：
```bash
cd MeoWise_Web
npm run build
npx cap sync android
# 重新在 Android Studio 中打包
```

### 方法 2: 使用 Capacitor 环境变量

编辑 `MeoWise_Web/.env`：
```bash
VITE_API_BACKEND_URL=https://your-backend.vercel.app
```

然后：
```bash
npm run build
npx cap sync android
```

---

## 五、完整部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Supabase 项目创建完成，获取连接字符串
- [ ] 后端部署到 Vercel，配置 DATABASE_URL 和 SECRET_KEY
- [ ] 获取后端部署后的域名（如 `meowise-api.vercel.app`）
- [ ] 前端配置正确的 API 地址
- [ ] 前端部署到 Vercel
- [ ] Android APK 构建成功

---

## 常见问题

### Q: Vercel 部署后端显示 500 错误
A: 检查环境变量 DATABASE_URL 是否正确配置

### Q: Android APK 无法连接后端
A: 
1. 确认使用 HTTP 而非 HTTPS（androidScheme 配置）
2. 确认 API 地址正确
3. 模拟器需要 `adb reverse tcp:8000 tcp:8000`

### Q: 如何更新已部署的版本
A: 只需重新 `git push`，Vercel 会自动重新部署