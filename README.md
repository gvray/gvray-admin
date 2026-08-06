# GVRAY Admin

> 基于 NestJS 11 的现代化后台管理脚手架，内置 RBAC 权限管理、Prisma ORM、JWT 认证、Swagger 与 Docker，开箱即用，适用于生产环境。

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.1.2-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-6.8.2-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Redis-6.0+-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-supported-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/github/stars/gvray/gvray-admin?style=social" alt="GitHub Stars" />
</p>

<p align="center">
  <img src="/docs/screenshots/demo.webp" alt="GVRAY Admin 预览" width="100%" />
</p>

## ✨ 特性亮点

- 🤖 **AI-Ready 开发** — 内置 `CLAUDE.md` 与模块化 AI 文档，Claude Code / Cursor / Copilot 秒懂项目架构
- 🔐 **RBAC 权限体系** — 基于角色的访问控制，支持动态权限扫描、菜单权限、权限缓存
- 🏗️ **NestJS 11 + TypeScript** — 严格类型检查，模块化架构，依赖注入
- 📝 **Swagger/OpenAPI** — 自动生成接口文档，Bearer Token 认证
- 🛡️ **安全防护** — JWT 认证、bcrypt 密码哈希、CORS、操作日志脱敏
- 🔑 **灵活登录** — 支持用户名、邮箱、手机号、userId 登录
- 🏢 **组织架构** — 完整的部门和岗位管理体系，树形结构
- ⚡ **Redis 缓存** — 会话管理、在线用户、接口限流、分布式锁、声明式缓存
- 🐳 **Docker 部署** — 开发/测试/生产三套工作流，支持滚动更新与自动回滚
- 🎯 **代码规范** — ESLint + Prettier，统一响应格式，完整的种子数据

## 🛠️ 技术栈

| 后端 | 版本 | 说明 |
|:---|:---|:---|
| [NestJS](https://nestjs.com/) | 11.1.2 | 渐进式 Node.js 框架 |
| [Prisma](https://www.prisma.io/) | 6.8.2 | 类型安全 ORM |
| [MySQL](https://www.mysql.com/) | 8.0+ | 关系型数据库 |
| [Redis](https://redis.io/) | 6.0+ | 缓存与会话存储 |
| [TypeScript](https://www.typescriptlang.org/) | 5.8.3 | 类型系统 |
| [JWT](https://jwt.io/) | — | 身份认证 |
| [Swagger](https://swagger.io/) | 11.2.0 | API 文档 |
| [Docker](https://www.docker.com/) | — | 容器化部署 |

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- MySQL >= 8.0
- Redis >= 6.0
- pnpm >= 9

### 开发环境

```bash
# 克隆项目
git clone https://github.com/gvray/gvray-admin.git
cd gvray-admin

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 启动 MySQL + Redis
docker compose -f docker-compose.dev.yml up -d mysql redis

# 数据库迁移 + 种子数据
pnpm prisma migrate dev
pnpm prisma db seed

# 启动开发服务（端口 3000）
pnpm start:dev
```

### Swagger 接口调试

```
http://localhost:3000/api
```

点击「Authorize」输入 `Bearer <accessToken>` 即可测试受保护接口。

## 👤 默认账户

| 角色 | 用户名 | 邮箱 | 密码 |
|:---|:---|:---|:---|
| 超级管理员 | `super_admin` | `super@example.com` | `123456` |
| 管理员 | `admin` | `admin@example.com` | `123456` |
| 游客 | `guest` | `guest@example.com` | `123456` |

## 📁 项目结构

```
src/
├── core/           # 基础设施（decorators / guards / interceptors / filters / pipes）
├── modules/        # 业务模块（auth / system / dashboard / profile）
├── prisma/         # Prisma Module / PrismaService
├── redis/          # Redis 基础设施（缓存 / 限流 / 分布式锁）
├── shared/         # 共享层（constants / DTOs / utils / BaseService）
└── main.ts         # 应用入口

prisma/             # Schema + 迁移 + Seed
docs/               # 项目文档
docker/             # Docker 部署配置
scripts/            # 构建 & 部署脚本
.claude/            # Claude Code AI 知识库
```

> 📖 [查看完整项目结构 →](docs/project-structure.md)

## 🤖 AI 编程支持

本项目提供轻量化的 AI 助手上下文：

- [`CLAUDE.md`](./CLAUDE.md) — Claude Code 自动加载入口
- [`.claude/project/`](./.claude/project/) — AI 按需知识库（架构 / DTO / 权限 / 响应格式等）

> 📖 [查看 AI 开发指南 →](docs/ai-development.md)

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [📖 功能特性清单](docs/features.md) | 完整功能模块与开发进度 |
| [🐳 Docker 部署指南](docs/deployment.md) | 开发/测试/生产部署、滚动更新 |
| [📋 统一响应格式](docs/response-format.md) | API 响应规范与最佳实践 |
| [⚙️ 系统配置项分析](docs/configs.md) | 前后端配置关联与实装状态 |
| [🏗️ 项目结构详解](docs/project-structure.md) | 完整目录结构与模块说明 |
| [🧪 API 测试指南](docs/api-testing.md) | Swagger 调试与认证流程 |
| [🤖 AI 开发指南](docs/ai-development.md) | AI 助手使用规范 |

### 配套前端

- [gvray-react](https://github.com/gvray/gvray-react) — React + TypeScript 管理后台

## 📄 开源协议

本项目采用 [MIT 许可证](LICENSE) 开源。

---

<p align="center">
  <img src="https://api.star-history.com/svg?repos=gvray/gvray-admin&type=Date" alt="Star History" />
</p>
