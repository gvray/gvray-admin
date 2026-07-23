# GVRAY Admin — Claude Code 指南

本文件是 Claude Code 自动加载入口，只保留高优先级规则。详细规范按需读取，不在这里导入长文档。

## 项目概况

GVRAY Admin 是 NestJS 11 + TypeScript 后端，使用 Prisma 6 + MySQL、JWT 认证、RBAC 权限模型、Swagger/OpenAPI 和 Docker 部署。

## 关键目录

- `src/core/`：基础设施（decorators / guards / interceptors / filters / pipes / strategies）
- `src/modules/`：业务模块，系统管理模块在 `src/modules/system/`
- `src/prisma/`：Nest Prisma Module / PrismaService
- `prisma/`：`schema.prisma`、`seed.ts`、`seeds/`、migrations（如存在）
- `src/shared/`：constants、DTO、interfaces、utils、services（含 BaseService）

## 开发硬规则

- 先读相关模块，不要整仓读取；文档与源码冲突时以源码为准。
- Controller 只处理路由、鉴权、DTO、Swagger；业务逻辑放 Service。
- 返回业务数据由 `ResponseInterceptor` 自动包装；自定义 message/code/分页用 `ResponseUtil`。
- 禁止返回未过滤的 Prisma 对象；禁止响应中出现 `password`、token、secret；禁止暴露数据库自增 `id`。
- 权限码使用 `src/shared/constants/permissions.constant.ts` 常量，不硬编码。
- 路径使用 tsconfig alias，避免深层相对路径。
- 改动涉及接口/权限/配置/响应/部署时，同步更新对应文档。
- 未经确认不运行数据库重置/迁移/seed、权限导入、部署发布等破坏性命令。
- 不确定文件位置时先 `grep` / `glob`，不假设路径。
- 错误信息、Swagger 描述统一使用中文。
- 提交使用 conventional commits（`feat:` / `fix:` / `refactor:` 等）。

## 按需阅读

- 改 DTO / Swagger → [.claude/project/dto-swagger.md](.claude/project/dto-swagger.md)
- 改权限码 / 权限扫描 → [.claude/project/permissions.md](.claude/project/permissions.md)
- 改统一响应格式 → [.claude/project/response-format.md](.claude/project/response-format.md)
- 改配置项或 seed 配置 → [.claude/project/configs.md](.claude/project/configs.md)
- 改部署、Docker、环境变量 → [.claude/project/deployment.md](.claude/project/deployment.md)
- 改密码/日志/审计/安全策略 → [.claude/project/coding.md](.claude/project/coding.md)
- 新增/重构业务模块 → [.claude/project/architecture.md](.claude/project/architecture.md) + dto-swagger.md + permissions.md
- 工作流和上下文策略 → [.claude/project/workflow.md](.claude/project/workflow.md)

## 常用命令

```bash
pnpm start:dev
pnpm build
pnpm test
pnpm prisma:generate
pnpm prisma:migrate   # 会改变数据库结构，执行前确认
pnpm prisma:seed      # 会写入/更新种子数据（含权限、菜单），执行前确认
pnpm db:reset         # 会重置数据库，必须明确确认
```
