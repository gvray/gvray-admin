# GVRAY Admin — Claude Code 项目指南

> 本文件面向 AI 编程助手（Claude Code / Cursor / Copilot 等）。
>
> **模块化文档**：本文档只保留项目概述和快速导航，具体规范请 @ 引用下方列出的子文档。

---

## 一、项目概述

**GVRAY Admin** 是一个基于 NestJS 的企业级后台管理系统后端，采用 RBAC 权限模型、Prisma ORM 和 RESTful API 架构。

- **框架**: NestJS 11 + TypeScript
- **ORM**: Prisma 6 (MySQL)
- **认证**: JWT (Access Token + Refresh Token)
- **文档**: Swagger (OpenAPI 3.0)
- **部署**: Docker + Docker Compose

---

## 二、目录结构

```
src/
├── config/                # 环境配置（.env → configuration.ts）
├── core/                  # 基础设施层
│   ├── decorators/        # @RequirePermissions, @CurrentUser 等
│   ├── filters/           # 异常过滤器
│   ├── guards/            # JWT / Roles / Permissions / GuestWrite
│   ├── interceptors/      # 响应格式化 / 操作日志 / 审计
│   ├── pipes/             # ValidationPipe / EmptyStringTransformPipe
│   ├── services/          # ApiPermissionSyncService / AuditService
│   └── strategies/        # Passport 策略（JWT Strategy）
├── modules/               # 业务模块
│   ├── auth/              # 认证授权（登录 / 注册 / 刷新令牌）
│   ├── dashboard/         # 仪表盘数据
│   ├── profile/           # 个人中心（修改密码 / 偏好设置）
│   └── system/            # 系统管理
│       ├── configs/       # 配置管理（键值对系统参数）
│       ├── departments/   # 部门管理（支持树形结构）
│       ├── dictionaries/  # 数据字典
│       ├── login-logs/    # 登录日志
│       ├── menu/          # 菜单管理
│       ├── monitor/       # 系统监控
│       ├── operation-logs/# 操作日志
│       ├── permissions/   # 权限管理（自动扫描 API）
│       ├── positions/     # 岗位管理
│       ├── roles/         # 角色管理
│       └── users/         # 用户管理（CRUD / 角色分配 / 重置密码）
├── prisma/                # Prisma Schema + 迁移 + Seed
└── shared/                # 共享层
    ├── constants/         # 权限码 / 用户状态 / 性别等常量
    ├── dtos/              # 通用 DTO（PaginationDto）
    ├── interfaces/        # TypeScript 接口
    ├── services/          # BaseService（通用分页）
    └── utils/             # 工具函数（ResponseUtil / TimeUtil）
```

---

## 三、模块化文档

> 开发前请阅读对应文档，修改代码时确保文档同步更新。

| 文档 | 内容 | 何时更新 |
|------|------|---------|
| [@docs/AGENTS.md](docs/AGENTS.md) | AI 编程指南：@符号用法、开发流程、避坑指南、代码变更时同步更新文档的规范 | 新增开发流程、新增避坑项、新增文档维护规则 |
| [@docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构约定：模块规范、路径别名、Controller/Service/DTO 规范、权限控制、统一响应格式、Prisma 查询规范 | 架构变更、新增规范、修改响应格式 |
| [@docs/CODING.md](docs/CODING.md) | 编码规范：TypeScript、NestJS、密码安全、日志与审计 | 编码风格变更、安全策略变更 |

---

## 四、快速命令

```bash
# 开发
pnpm start:dev              # 热更新启动
pnpm prisma:studio          # 打开 Prisma GUI

# 数据库
pnpm prisma:migrate         # 创建迁移
pnpm prisma:seed            # 执行 seed
pnpm db:reset               # 重置数据库并重新 seed

# Docker
pnpm docker:dev:up          # 本地开发（含 MySQL）
pnpm docker:up              # 生产部署
pnpm docker:deploy          # 滚动更新部署

# 其他
pnpm lint                   # ESLint 检查
pnpm test                   # 单元测试
pnpm build                  # 生产构建
```

---

## 五、环境变量

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://root:password@localhost:3306/app"
JWT_SECRET=your-super-secret-key
```

完整配置参考 [.env.example](.env.example)。
