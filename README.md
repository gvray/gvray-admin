# GVRAY Admin

>✨ 基于 NestJS 的现代后台管理脚手架，内置 RBAC 权限管理、Prisma ORM、JWT 认证、Swagger 与 Docker，开箱即用，适用于生产环境。

GVRAY Admin 是一个现代化的后台管理模板，帮助开发者快速构建中后台系统。项目采用 NestJS、Prisma、MySQL 和 RESTful API 构建，提供完整的 RBAC 权限体系、JWT 身份认证、系统管理模块以及规范的工程架构。

与传统后台模板不同，GVRAY Admin 内置 **AI-Ready** 开发体验，提供 `CLAUDE.md` 与模块化 AI 文档，使 Claude Code、Cursor 和 GitHub Copilot 能快速理解项目架构、编码规范和业务模块，生成符合项目规范的代码。

> 🖥️ 配套前端：[gvray-react](https://github.com/gvray/gvray-react) — React + TypeScript 管理后台


## 💫 特性亮点

- 🤖 **AI 驱动开发** - 内置 Claude Code / Cursor / Copilot 项目配置（`CLAUDE.md`），AI 助手可秒懂项目架构，自动生成符合规范的代码
- 🎯 **TypeScript** - 严格的类型检查，提供完整的类型定义
- 🏗️ **模块化架构** - 基于 NestJS 模块化设计，支持按需加载
- 🔐 **RBAC 权限** - 基于角色的访问控制，灵活的权限管理
- 📝 **Swagger** - 自动生成 OpenAPI 规范的接口文档
- 🎨 **代码规范** - 遵循 TypeScript 最佳实践，统一的代码风格
- 🔄 **数据迁移** - 基于 Prisma 的数据库版本控制和迁移
- 🛡️ **安全防护** - JWT 认证、密码 bcrypt 哈希、RBAC 权限控制、CORS、操作日志脱敏
- 🔑 **灵活登录** - 支持用户名、邮箱、手机号、userId 登录
- 🏢 **组织架构** - 完整的部门和岗位管理体系
- ⚡ **Redis 缓存** - 集成 Redis 实现会话管理、在线用户、接口限流、分布式锁与声明式缓存

## 🚀 技术栈

### 后端技术

- **[NestJS](https://nestjs.com/)** - 渐进式 Node.js 框架，支持完整的依赖注入
- **[Prisma](https://www.prisma.io/)** - 下一代 ORM，类型安全且高性能
- **[MySQL](https://www.mysql.com/)** - 企业级关系型数据库
- **[Redis](https://redis.io/)** - 高性能缓存与会话存储
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript 的超集，提供类型系统
- **[JWT](https://jwt.io/)** - JSON Web Token 认证机制
- **[Swagger](https://swagger.io/)** - API 文档生成与测试工具

### 开发工具

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Jest** - 单元测试框架
- **Docker** - 容器化部署支持

## ✨ 功能特性

### 🔐 认证与授权

- [x] 完整的注册登录流程
- [x] JWT 令牌认证机制
- [x] 支持用户名、邮箱、手机号登录
- [x] 权限验证守卫
- [x] 角色权限管理
- [x] 刷新令牌机制（Access Token + Refresh Token）
- [x] 登录日志记录与分析
- [x] 注册功能开关（Feature Flag 控制）
- [ ] 单点登录（SSO）集成
- [ ] OAuth2 第三方登录（GitHub、Google、微信）
- [ ] 双因素认证（2FA / MFA）
- [ ] 登录失败限制与账号锁定

### 👥 用户管理

- [x] 用户基础管理（CRUD）
- [x] 灵活的角色分配
- [x] 部门岗位关联
- [x] 批量删除用户
- [ ] 用户数据导入导出（Excel、CSV）
- [x] 用户状态管理（启用 / 禁用）
- [ ] 头像上传管理（本地/云存储）
- [x] 操作日志
- [ ] 用户登录设备管理

### 👑 角色权限

- [x] 角色基础管理（CRUD）
- [x] 角色权限管理
- [x] RBAC 权限控制
- [x] 权限代码管理
- [x] 权限分配机制
- [x] 多模块基础权限预设（通过权限常量与扫描流程同步）
- [x] 批量删除角色
- [ ] 数据权限控制（行级、列级）
- [x] 菜单权限管理
- [x] 权限缓存优化（Redis）
- [ ] 权限树形结构
- [x] 动态权限加载（API 自动扫描）
- [ ] 临时权限分配
- [ ] 权限继承机制

### 🏢 组织架构

- [x] 部门管理（CRUD）
- [x] 岗位管理（CRUD）
- [x] 部门岗位关联
- [x] 组织架构树形展示
- [x] 多级部门支持（parentId + 树形结构）
- [ ] 部门权限继承
- [ ] 岗位权限模板

### ⚙️ 系统管理

- [x] 系统参数配置（键值对配置管理）
- [x] 数据字典维护
- [x] 菜单动态管理
- [ ] 系统通知公告
- [x] 操作日志
- [x] 登录日志
- [x] 操作日志（Interceptor 自动记录）
- [ ] 系统运行日志
- [ ] 系统备份还原
- [ ] 敏感数据加密

### 📚 接口文档

- [x] Swagger 接口文档（OpenAPI 3.0）
- [x] 详细的API描述和示例
- [x] Bearer Token 认证支持
- [ ] 接口版本管理
- [ ] 接口访问控制（限流、黑白名单）
- [ ] 接口性能监控
- [ ] 接口调试工具
- [ ] Mock 数据支持

### 🔍 系统监控

- [x] 在线用户监控（实时统计，基于 Redis 会话心跳）
- [x] 服务器状态监控（CPU、内存、磁盘）
- [ ] 数据库性能监控
- [x] 缓存系统监控（Redis 命中率、Key 统计、内存分析）
- [ ] 定时任务管理（任务调度）
- [x] 服务健康检查（/health）
- [ ] 性能分析工具
- [ ] 告警通知机制

### 🛠️ 开发支持

- [x] 数据库迁移工具（Prisma Migrate）
- [x] 数据填充脚本（Seed）
- [x] 完整的种子数据（管理员、角色、权限、部门、岗位）
- [ ] 代码自动生成（CRUD）
- [ ] 表单在线构建
- [x] 开发技术文档（README / DOCKER_DEPLOYMENT / UNIFIED_RESPONSE_GUIDE / CLAUDE.md）
- [ ] 单元测试覆盖
- [ ] API 自动化测试
- [ ] 持续集成/持续部署（CI/CD）

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- MySQL >= 8.0
- Redis >= 6.0（项目使用 Redis 7，docker-compose 已内置）
- pnpm >= 9（与 `packageManager` 字段一致）

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/gvray/nest-admin.git

# 进入项目目录
cd nest-admin

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 注意：本地开发数据库名建议与 docker-compose.dev.yml 一致（默认 gvray_admin）

# 启动 MySQL + Redis（docker-compose.dev.yml 已内置）
docker compose -f docker-compose.dev.yml up -d mysql redis

# 执行数据库迁移
pnpm prisma migrate dev

# 初始化基础数据
pnpm prisma db seed

# 启动开发服务（默认端口 3000）
pnpm start:dev
```

### 生产环境部署

```bash
# 构建项目
pnpm build

# 启动服务（默认端口 3000）
pnpm start:prod
```

## 👤 默认账户

| 角色 | 用户名 | 邮箱 | 密码 |
|------|--------|------|------|
| 超级管理员 | `super_admin` | `super@example.com` | `123456`（可通过 `SUPER_ADMIN_INITIAL_PASSWORD` 覆盖） |
| 管理员 | `admin` | `admin@example.com` | `123456`（可通过 `SUPER_ADMIN_INITIAL_PASSWORD` 覆盖） |
| 游客 | `guest` | `guest@example.com` | `123456` |

> 注册接口受 `feature.register` 配置控制，默认关闭（seed 中值为 `false`），可在系统配置中开启。

## 🔧 API 测试

服务启动后，访问 Swagger UI 进行接口调试：

```text
http://localhost:3000/api
```

点击「Authorize」输入登录接口返回的 `accessToken`（格式：`Bearer xxx`）即可测试受保护接口。默认账户见上表。

## 🤖 AI 编程支持

本项目提供轻量化的 AI 助手上下文，避免默认加载过多文档：

- [CLAUDE.md](./CLAUDE.md)：Claude Code 自动加载入口，只保留项目硬规则和按需索引。
- [.claude/project/](./.claude/project/)：AI 助手按需知识库，包含工作流、架构、DTO、权限、响应格式等细分说明。

使用 AI 编程时，先让助手读取相关模块文件；涉及 DTO、权限、响应格式、配置或部署时，再按需读取 `.claude/project/` 下对应文档。

---

## 📁 项目结构

```
src/
├── config/               # 环境配置（.env → configuration.ts）
├── core/                 # 基础设施层
│   ├── decorators/       # @RequirePermissions, @CurrentUser, @OperationLog 等
│   ├── filters/          # 全局异常过滤器
│   ├── guards/           # JWT / Roles / Permissions / GuestWrite / FeatureFlag
│   ├── interceptors/     # 响应格式化 / 操作日志
│   ├── pipes/            # EmptyStringTransformPipe / ValidationPipe
│   ├── services/         # ApiPermissionSyncService / AuditService
│   └── strategies/       # Passport JWT Strategy
├── modules/              # 业务模块
│   ├── auth/             # 认证授权（登录 / 注册 / 刷新令牌 / 登出）
│   ├── dashboard/        # 仪表盘数据
│   ├── profile/          # 个人中心（修改密码 / 偏好设置）
│   └── system/           # 系统管理
├── redis/                # Redis 基础设施（全局模块）
│   ├── cache.service.ts      # 通用缓存读写
│   ├── lock.service.ts       # 分布式锁
│   ├── rate-limiter.service.ts # 接口限流
│   ├── cacheable.decorator.ts  # 声明式缓存装饰器
│   └── constants/            # Redis Key 常量
│       ├── configs/      # 配置管理（键值对系统参数）
│       ├── departments/  # 部门管理（CRUD + 树形结构）
│       ├── dictionaries/ # 数据字典
│       ├── login-logs/   # 登录日志
│       ├── menu/         # 菜单管理（动态菜单）
│       ├── monitor/      # 系统监控
│       ├── operation-logs/ # 操作日志（Interceptor 自动记录）
│       ├── permissions/  # 权限管理（自动扫描 API 生成）
│       ├── positions/    # 岗位管理
│       ├── roles/        # 角色管理（CRUD + 权限分配）
│       └── users/        # 用户管理（CRUD + 角色分配 + 重置密码）
├── prisma/               # Prisma Module / PrismaService（@Global()）
│   ├── prisma.module.ts
│   └── prisma.service.ts

prisma/                     # Prisma Schema + 迁移 + Seed（项目根目录，与 src/ 同级）
├── schema.prisma
├── migrations/
├── seeds/                  # 种子数据（用户 / 角色 / 权限 / 部门 / 岗位 / 配置）
└── seed.ts
├── shared/               # 共享层
│   ├── constants/        # 权限码 / 用户状态 / 性别等常量
│   ├── dtos/             # 通用 DTO（PaginationDto / PaginationSortDto）
│   ├── interfaces/       # TypeScript 接口
│   ├── services/         # BaseService（通用分页 + buildWhere）
│   └── utils/            # 工具函数（ResponseUtil / TimeUtil）
└── main.ts               # 应用入口（Swagger / 全局管道 / 拦截器）

.claude/                  # Claude Code 配置与 AI 按需知识库
└── project/              # AI 工作流 / 架构 / DTO / 权限等按需文档

docker/                   # Docker 部署配置
├── nginx/
│   └── default.conf      # Nginx 生产配置（限流 / HTTPS / 代理）
└── scripts/
    └── deploy.sh         # 生产滚动部署脚本

scripts/                  # 构建 & 部署脚本
├── docker-build.ts       # Docker 镜像构建
└── docker-deploy.ts      # 生产滚动更新
```

## 📄 开源协议

本项目采用 [MIT 许可证](LICENSE) 开源。

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request 贡献代码。

## 📚 相关文档

### 项目文档

- [Docker 部署指南](./DOCKER_DEPLOYMENT.md)
- [统一响应格式指南](./UNIFIED_RESPONSE_GUIDE.md)
- [系统配置项分析](./CONFIGS_ANALYSIS.md)

### 配套前端

- [gvray-react](https://github.com/gvray/gvray-react) — React + TypeScript 管理后台

### 外部参考

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
