# 社交关系备忘录系统 (Social Memo)

一个功能完整的个人社交关系管理系统，帮助您记录、管理和维护社交网络中的各种关系。

## 目录

- [功能特性](#功能特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [API 文档](#api-文档)
- [安全机制](#安全机制)
- [开发指南](#开发指南)
- [部署说明](#部署说明)

---

## 功能特性

### 核心功能

| 功能模块 | 描述 |
|---------|------|
| **联系人管理** | 添加、编辑、删除联系人，支持分组、标签、收藏、置顶 |
| **关系图谱** | 可视化展示联系人之间的关系网络 |
| **社交分析** | 分析社交圈构成、联系频率报告 |
| **活动管理** | 记录社交活动，关联参与者，上传活动照片 |
| **礼物记录** | 追踪送出和收到的礼物，智能推荐 |
| **借还记录** | 管理借出和借入的物品/金钱 |
| **提醒系统** | 生日提醒、节日问候、周期性联系提醒 |
| **消息模板** | 预设祝福语模板，支持变量替换 |

### 高级功能

| 功能 | 描述 |
|-----|------|
| **智能去重** | 自动检测重复联系人，支持合并 |
| **自定义字段** | 为联系人添加自定义属性 |
| **批量操作** | 批量修改分组、标签、删除 |
| **数据导入导出** | 支持 JSON、Excel、vCard 格式 |
| **回收站** | 已删除联系人可恢复 |
| **操作日志** | 完整的操作审计记录 |
| **深色模式** | 支持明暗主题切换 |

---

## 技术架构

### 前端技术栈

```
React 18 + TypeScript + Vite
├── Ant Design 5.x    # UI 组件库
├── Axios            # HTTP 客户端
├── ECharts          # 关系图谱可视化
└── Day.js           # 日期处理
```

### 后端技术栈

```
Node.js + Express + TypeScript
├── sql.js           # 纯 JavaScript SQLite 实现
├── Helmet           # HTTP 安全头
├── express-rate-limit # 速率限制
├── Multer           # 文件上传
└── crypto           # 密码加密
```

### 数据存储

- **数据库**: SQLite（使用 sql.js，无需安装原生依赖）
- **文件存储**: 本地文件系统（头像、照片等）

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd social-memo

# 2. 安装后端依赖
cd backend
npm install

# 3. 安装前端依赖
cd ../frontend
npm install

# 4. 启动后端服务
cd ../backend
npm run dev

# 5. 启动前端服务（新终端）
cd ../frontend
npm run dev
```

### 访问系统

- **前端地址**: http://localhost:13579
- **后端 API**: http://localhost:3001/api

### 默认账号

| 字段 | 值 |
|-----|-----|
| 用户名 | `admin` |
| 密码 | `social2024` |

> ⚠️ 首次登录后请立即修改默认密码！

---

## 项目结构

```
social-memo/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts    # 数据库配置和初始化
│   │   │   └── server.ts      # 服务器配置
│   │   ├── routes/
│   │   │   └── api.ts         # API 路由定义
│   │   ├── services/
│   │   │   ├── authService.ts      # 认证服务
│   │   │   ├── contactService.ts   # 联系人服务
│   │   │   ├── activityService.ts  # 活动服务
│   │   │   ├── giftService.ts      # 礼物服务
│   │   │   ├── reminderService.ts  # 提醒服务
│   │   │   ├── uploadService.ts    # 文件上传服务
│   │   │   └── newFeaturesService.ts # 新功能服务集合
│   │   └── server.ts          # 服务器入口
│   ├── data/                   # 数据库文件
│   ├── uploads/                # 上传文件
│   └── package.json
│
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── components/        # React 组件
│   │   │   ├── LoginPage.tsx       # 登录页面
│   │   │   ├── Dashboard.tsx       # 仪表板
│   │   │   ├── ContactList.tsx     # 联系人列表
│   │   │   ├── ContactDetail.tsx   # 联系人详情
│   │   │   ├── ContactForm.tsx     # 联系人表单
│   │   │   ├── RelationshipGraph.tsx # 关系图谱
│   │   │   ├── SocialAnalysis.tsx  # 社交分析
│   │   │   ├── ActivityList.tsx    # 活动列表
│   │   │   ├── GiftManager.tsx     # 礼物管理
│   │   │   ├── LoanManager.tsx     # 借还记录
│   │   │   ├── TemplateManager.tsx # 消息模板
│   │   │   ├── HolidayManager.tsx  # 节日管理
│   │   │   ├── PeriodicReminderManager.tsx # 周期提醒
│   │   │   ├── DuplicateManager.tsx # 去重管理
│   │   │   ├── CustomFieldManager.tsx # 自定义字段
│   │   │   ├── TrashManager.tsx    # 回收站
│   │   │   ├── OperationLogs.tsx   # 操作日志
│   │   │   └── Settings.tsx        # 系统设置
│   │   ├── services/
│   │   │   └── api.ts         # API 调用封装
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── App.tsx            # 应用主组件
│   │   └── main.tsx           # 入口文件
│   └── package.json
│
└── README.md                   # 项目文档
```

---

## API 文档

### 认证相关

| 方法 | 路径 | 描述 | 认证 |
|-----|------|-----|-----|
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| GET | `/api/auth/check` | 检查登录状态 | 否 |
| POST | `/api/auth/change-password` | 修改密码 | 是 |

### 联系人管理

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | `/api/contacts` | 获取联系人列表（支持分页、搜索、筛选） |
| GET | `/api/contacts/:id` | 获取联系人详情 |
| POST | `/api/contacts` | 创建联系人 |
| PUT | `/api/contacts/:id` | 更新联系人 |
| DELETE | `/api/contacts/:id` | 删除联系人（软删除） |
| POST | `/api/contacts/:id/favorite` | 切换收藏状态 |
| POST | `/api/contacts/:id/pin` | 切换置顶状态 |

### 关系图谱

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | `/api/relationships/graph` | 获取关系图谱数据 |
| GET | `/api/relationships` | 获取所有关系 |
| POST | `/api/relationships` | 添加关系 |
| DELETE | `/api/relationships/:id` | 删除关系 |

### 活动管理

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | `/api/activities` | 获取活动列表 |
| POST | `/api/activities` | 创建活动 |
| PUT | `/api/activities/:id` | 更新活动 |
| DELETE | `/api/activities/:id` | 删除活动 |
| POST | `/api/activities/:id/participants` | 添加参与者 |

### 礼物记录

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | `/api/gifts` | 获取礼物列表 |
| GET | `/api/gifts/stats` | 获取礼物统计 |
| POST | `/api/gifts` | 添加礼物记录 |
| PUT | `/api/gifts/:id` | 更新礼物记录 |
| DELETE | `/api/gifts/:id` | 删除礼物记录 |

### 借还记录

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | `/api/loans` | 获取借还列表 |
| GET | `/api/loans/stats` | 获取借还统计 |
| POST | `/api/loans` | 添加借还记录 |
| POST | `/api/loans/:id/return` | 标记已归还 |
| DELETE | `/api/loans/:id` | 删除记录 |

### 提醒系统

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | `/api/reminders` | 获取提醒列表 |
| GET | `/api/reminders/count` | 获取未读数量 |
| POST | `/api/reminders/generate` | 生成生日提醒 |
| POST | `/api/reminders/:id/read` | 标记已读 |

### 数据导入导出

| 方法 | 路径 | 描述 |
|-----|------|-----|
| GET | `/api/export` | 导出 JSON |
| GET | `/api/export/excel` | 导出 Excel 格式 |
| GET | `/api/export/vcard` | 导出 vCard |
| POST | `/api/import` | 导入 JSON |
| POST | `/api/import/excel` | 导入 Excel |
| POST | `/api/import/vcard` | 导入 vCard |

---

## 安全机制

### 1. 认证系统

- **密码存储**: PBKDF2 + SHA512 哈希，10000 次迭代，16 字节随机盐
- **Token**: 32 字节随机生成，7 天有效期
- **会话管理**: 内存存储活跃 Token，支持登出失效

### 2. 速率限制

| 类型 | 限制 | 时间窗口 |
|-----|------|---------|
| 全局 API | 1000 次/IP | 15 分钟 |
| 登录接口 | 5 次/IP | 15 分钟 |

### 3. HTTP 安全

- **Helmet**: 自动添加安全相关 HTTP 头
- **CORS**: 限制跨域请求来源
- **内容安全策略**: 防止 XSS 攻击

### 4. 数据安全

- **软删除**: 删除数据进入回收站，可恢复
- **操作日志**: 完整记录所有数据变更
- **输入验证**: 服务端验证所有输入参数

---

## 开发指南

### 环境配置

后端配置文件 `backend/src/config/server.ts`:

```typescript
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

### 数据库 Schema

主要数据表：

```sql
-- 联系人表
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,           -- 朋友/家人/同事/客户/同学/其他
  relationship_level TEXT,      -- 陌生/认识/一般/熟悉/亲密
  gender TEXT,
  birthday TEXT,
  phone TEXT,
  email TEXT,
  wechat TEXT,
  company TEXT,
  position TEXT,
  address TEXT,
  tags TEXT,                    -- JSON 数组
  notes TEXT,
  avatar TEXT,
  is_favorite INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 联系人关系表
CREATE TABLE contact_relationships (
  id INTEGER PRIMARY KEY,
  contact_id_1 INTEGER,
  contact_id_2 INTEGER,
  relationship_type TEXT,       -- 朋友/同事/家人/同学/其他
  strength INTEGER DEFAULT 50   -- 关系强度 0-100
);

-- 更多表结构请参考 database.ts
```

### 添加新功能

1. **后端**:
   - 在 `services/` 目录添加服务
   - 在 `routes/api.ts` 添加路由
   - 重新编译 `npm run build`

2. **前端**:
   - 在 `services/api.ts` 添加 API 调用
   - 在 `components/` 添加组件
   - 在 `App.tsx` 添加路由/菜单

### 代码规范

- TypeScript 严格模式
- ESLint + Prettier 格式化
- 组件使用函数式 + Hooks
- 服务层与路由层分离

---

## 部署说明

### 开发环境

```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

### 生产构建

```bash
# 后端构建
cd backend && npm run build

# 前端构建
cd frontend && npm run build

# 启动生产服务
cd backend && npm start
```

### Docker 部署（可选）

```dockerfile
# Dockerfile 示例
FROM node:18-alpine

WORKDIR /app

# 安装后端依赖
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# 安装前端依赖并构建
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci && npm run build

# 复制源代码
COPY backend ./backend
COPY frontend ./frontend

# 构建后端
RUN cd backend && npm run build

EXPOSE 3001
CMD ["node", "backend/dist/server.js"]
```

### 数据备份

数据库文件位于 `backend/data/social_memo.db`，定期备份此文件即可。

```bash
# 备份命令
cp backend/data/social_memo.db backup/social_memo_$(date +%Y%m%d).db
```

---

## 许可证

MIT License

---

## 更新日志

### v1.0.0 (2024-12)

- 初始版本发布
- 完整的联系人管理功能
- 关系图谱可视化
- 活动、礼物、借还记录管理
- 提醒系统
- 数据导入导出
- 用户认证和安全机制
