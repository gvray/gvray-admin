# 项目结构详解

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
