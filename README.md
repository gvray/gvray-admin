# GVRAY Admin

✨ **GVRAY Admin** 是面向 AI 驱动开发的企业级后台管理系统，基于 [NestJS](https://nestjs.com/)、[Prisma](https://www.prisma.io/)、MySQL 和 RESTful API 构建，内置完整的 AI 编程助手配置。项目提供 `CLAUDE.md` 及模块化文档，AI 助手可自动理解项目架构并生成符合规范的代码。

> 🖥️ **配套前端**：[`gvray-react`](https://github.com/gvray/gvray-react) — React + TypeScript 管理后台

## 💫 特性亮点

- 🤖 **AI 驱动开发** - 内置 Claude Code / Cursor / Copilot 项目配置（`CLAUDE.md`），AI 助手可秒懂项目架构，自动生成符合规范的代码
- 🎯 **TypeScript** - 严格的类型检查，提供完整的类型定义
- 🏗️ **模块化架构** - 基于 NestJS 模块化设计，支持按需加载
- 🔐 **RBAC 权限** - 基于角色的访问控制，灵活的权限管理
- 📝 **Swagger** - 自动生成 OpenAPI 规范的接口文档
- 🎨 **代码规范** - 遵循 TypeScript 最佳实践，统一的代码风格
- 🔄 **数据迁移** - 基于 Prisma 的数据库版本控制和迁移
- 🛡️ **安全防护** - JWT 认证，请求加密，CORS 配置等
- 🔑 **灵活登录** - 支持用户名或邮箱登录
- 🏢 **组织架构** - 完整的部门和岗位管理体系

## 🚀 技术栈

### 后端技术
- **[NestJS](https://nestjs.com/)** - 渐进式 Node.js 框架，支持完整的依赖注入
- **[Prisma](https://www.prisma.io/)** - 下一代 ORM，类型安全且高性能
- **[MySQL](https://www.mysql.com/)** - 企业级关系型数据库
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
- [x] 支持用户名或邮箱登录
- [x] 权限验证守卫
- [x] 角色权限管理
- [x] 刷新令牌机制（Access Token + Refresh Token）
- [x] 登录日志记录与分析
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
- [x] 操作审计日志
- [ ] 用户登录设备管理

### 👑 角色权限
- [x] 角色基础管理（CRUD）
- [x] 角色权限管理
- [x] RBAC 权限控制
- [x] 权限代码管理
- [x] 权限分配机制
- [x] 25个基础权限预设
- [x] 批量删除角色
- [ ] 数据权限控制（行级、列级）
- [x] 菜单权限管理
- [ ] 权限缓存优化（Redis）
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
- [x] 操作审计日志
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
- [ ] 在线用户监控（实时统计）
- [x] 服务器状态监控（CPU、内存、磁盘）
- [ ] 数据库性能监控
- [ ] 缓存系统监控
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
- [x] 开发技术文档（README / SWAGGER_USAGE / DOCKER_DEPLOYMENT / UNIFIED_RESPONSE_GUIDE / CLAUDE.md）
- [ ] 单元测试覆盖
- [ ] API 自动化测试
- [ ] 持续集成/持续部署（CI/CD）

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- MySQL >= 8.0
- pnpm >= 8.0

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

# 执行数据库迁移
pnpm prisma migrate dev

# 初始化基础数据
pnpm prisma db seed

# 启动开发服务
pnpm start:dev
```

### 生产环境部署
```bash
# 构建项目
pnpm build

# 启动服务
pnpm start:prod
```

## 👤 默认账户

- 管理员账号：admin@example.com 或 admin
- 初始密码：123456

## 🔧 API 测试

### 登录测试
```bash
# 用户名登录
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account": "admin", "password": "123456"}'

# 邮箱登录
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account": "admin@example.com", "password": "123456"}'
```

### 获取用户列表
```bash
# 使用登录返回的 token
curl -X GET http://localhost:8001/system/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🤖 AI 编程支持

本项目专为 AI 驱动开发优化，内置完整的 AI 助手配置：

### CLAUDE.md — AI 项目指南

项目根目录下的 [`CLAUDE.md`](./CLAUDE.md) 是为 Claude Code / Cursor / GitHub Copilot 等 AI 工具编写的项目指南，包含：

- **架构约定** — 模块结构、路径别名、权限命名规范
- **编码规范** — Controller / Service / DTO 的标准写法
- **开发流程** — 新增模块、数据库变更、权限扫描的标准步骤
- **避坑指南** — 常见错误和 AI 容易踩的坑

使用 AI 编程时，助手会自动读取 `CLAUDE.md`，生成的代码**直接符合项目规范**，无需人工调整。

### AI 编程优势

| 场景 | 传统开发 | AI 驱动开发 |
|------|---------|------------|
| 新增一个 CRUD 模块 | 30 分钟（写代码 + 调规范） | **3 分钟**（AI 生成，直接可用） |
| 新增权限控制 | 手动改常量 + 装饰器 + seed | AI 一键同步，零遗漏 |
| 数据库变更 | 改 schema + 手动写迁移 + 同步 DTO | AI 自动改 schema + 生成 DTO + 更新 service |
| 代码审查 | 人工逐行检查 | AI 基于 `CLAUDE.md` 规范自动审查 |

> 💡 **提示**: 使用 Claude Code 打开本项目，输入 `/init` 即可自动加载项目配置。

---

## 📁 项目结构

```
src/
├── config/               # 环境配置（.env → configuration.ts）
├── core/                 # 基础设施层
│   ├── decorators/       # @RequirePermissions, @CurrentUser, @Audit 等
│   ├── filters/          # 全局异常过滤器
│   ├── guards/           # JWT / Roles / Permissions / GuestWrite / FeatureFlag
│   ├── interceptors/     # 响应格式化 / 操作日志 / 审计
│   ├── pipes/            # ValidationPipe / EmptyStringTransformPipe
│   ├── services/         # ApiPermissionSyncService / AuditService
│   └── strategies/       # Passport JWT Strategy
├── modules/              # 业务模块
│   ├── auth/             # 认证授权（登录 / 注册 / 刷新令牌 / 登出）
│   ├── dashboard/        # 仪表盘数据
│   ├── profile/          # 个人中心（修改密码 / 偏好设置）
│   └── system/           # 系统管理
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
├── prisma/               # Prisma Schema + 迁移 + Seed
│   ├── schema.prisma
│   ├── migrations/
│   ├── seeds/            # 种子数据（用户 / 角色 / 权限 / 部门 / 岗位 / 配置）
│   └── seed.ts
├── shared/               # 共享层
│   ├── constants/        # 权限码 / 用户状态 / 性别等常量
│   ├── dtos/             # 通用 DTO（PaginationDto）
│   ├── interfaces/       # TypeScript 接口
│   ├── services/         # BaseService（通用分页）
│   └── utils/            # 工具函数（ResponseUtil / TimeUtil）
└── main.ts               # 应用入口（Swagger / 全局管道 / 拦截器）

docs/                     # AI 编程助手文档
├── AGENTS.md             # AI 编程指南（@符号 / 开发流程 / 避坑）
├── ARCHITECTURE.md       # 架构约定（模块 / 权限 / 响应格式 / DTO 规范）
└── CODING.md             # 编码规范（TS / NestJS / 安全 / 日志）

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
- [Swagger API 文档说明](./SWAGGER_USAGE.md)
- [统一响应格式指南](./UNIFIED_RESPONSE_GUIDE.md)
- [系统配置项分析](./CONFIGS_ANALYSIS.md)

### 配套前端
- [gvray-react](https://github.com/gvray/gvray-react) — React + TypeScript 管理后台

### 外部参考
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
