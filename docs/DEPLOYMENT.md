# MeoWise 部署指南

## 1. 数据库迁移到 Supabase

### 步骤 1: 创建 Supabase 项目
1. 访问 [supabase.com](https://supabase.com) 注册/登录
2. 点击 "New Project"
3. 填写信息:
   - Name: `meowise`
   - Database Password:  设置强密码
   - Region: 选择亚洲区域 (Asia)
4. 等待项目创建完成（约 2 分钟）

### 步骤 2: 获取连接字符串
1. 进入 Project Settings → Database
2. 找到 "Connection String" 部分
3. 复制 URI（格式如下）:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 步骤 3: 同步 SQLite 数据到 Supabase

#### 方式 A: 使用 pg_dump (推荐)
```bash
# 1. 导出 SQLite 数据
sqlite3 test.db ".dump" > test.sql

# 2. 转换为 PostgreSQL 格式（手动调整）
# - 删除 PRIMARY KEY 内的 AUTOINCREMENT，改用 GENERATED ALWAYS AS IDENTITY
# - 删除 CHECK_same_thread 参数
# - 日期函数转换

# 3. 在 Supabase SQL Editor 执行
# 需要手动转换 SQL 语法差异
```

#### 方式 B: 直接创建表结构
```bash
# 1. 安装 SQLAlchemy 支持
pip install sqlalchemy[postgresql] alembic

# 2. 设置环境变量
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres"

# 3. 运行后端（会自动创建表）
cd backend
python main.py
```

### 步骤 4: 更新后端配置

在 `backend/.env` 中添加:
```env
# Supabase PostgreSQL 连接字符串
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## 2. 部署后端到 Vercel

### 步骤 1: 准备后端代码
```bash
# 1. 创建 vercel.json
cat > backend/vercel.json << 'EOF'
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python",
      "config": {
        "runtime": "python3.9",
        "installCommand": "pip install -r requirements.txt"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/v1/(.*)",
      "dest": "main.py"
    },
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "SECRET_KEY": "@secret_key"
  }
}
EOF

# 2. 更新 main.py 添加路由处理
# Vercel Serverless 需要将 FastAPI 调整为 ASGI 模式
```

### 步骤 2: 创建后端 requirements.txt
```bash
# 在 requirements.txt 添加
uvicorn[standard]
python-dotenv
```

### 步骤 3: 部署后端
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 进入后端目录
cd backend

# 3. 登录并部署
vercel login
vercel --prod
```

### 步骤 4: 配置环境变量
在 Vercel Dashboard → Settings → Environment Variables:
| 变量名 | 值 |
|--------|-----|
| DATABASE_URL | postgresql://... (Supabase 连接字符串) |
| SECRET_KEY | 随机字符串（用于 JWT） |

---

## 3. 部署前端到 Vercel

### 步骤 1: 配置前端环境变量
在 `MeoWise_Web/.env` 中:
```env
# 生产环境使用 Vercel 分配的域名或自定义域名
VITE_API_BACKEND_URL=https://your-backend.vercel.app
```

### 步骤 2: 部署前端
```bash
# 方法 1: Vercel CLI
cd MeoWise_Web
vercel --prod

# 方法 2: GitHub 集成
# 1. 推送代码到 GitHub
# 2. 在 Vercel Dashboard 导入项目
# 3. 配置构建命令: npm run build
# 4. 配置输出目录: dist
```

---

## 4. Vercel 环境变量配置汇总

### 后端 (backend/.env)
```env
# 数据库 (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# 安全
SECRET_KEY=your-super-secret-key-change-this

# MQTT (可选)
MQTT_BROKER_HOST=broker.emqx.io
MQTT_BROKER_PORT=1883
```

### 前端 (MeoWise_Web/.env)
```env
# API 地址 - 生产环境使用后端域名
VITE_API_BACKEND_URL=https://your-api.vercel.app
```

---

## 5. Android 应用配置

部署完成后，修改 Android 连接的 API 地址:
```javascript
// 在 main.tsx 中修改
baseUrl = 'https://your-api.vercel.app';
```

或在 `.env` 中:
```bash
VITE_API_BACKEND_URL=https://your-api.vercel.app
```

---

## 快速检查清单

- [ ] Supabase 项目创建完成
- [ ] 获取 PostgreSQL 连接字符串
- [ ] 后端 DATABASE_URL 配置正确
- [ ] Vercel 后端部署成功
- [ ] Vercel 前端部署成功
- [ ] Android .env 配置生产 API 地址
- [ ] 重新 build 并同步到 Android