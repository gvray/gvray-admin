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

## 按需阅读

- AI 工作流和上下文策略：[.claude/project/workflow.md](.claude/project/workflow.md)
- 架构、模块、权限、Prisma 总则：[.claude/project/architecture.md](.claude/project/architecture.md)
- DTO / Swagger 详细规范：[.claude/project/dto-swagger.md](.claude/project/dto-swagger.md)
- 编码、安全、日志规范：[.claude/project/coding.md](.claude/project/coding.md)
- 权限码和扫描流程：[.claude/project/permissions.md](.claude/project/permissions.md)
- 统一响应摘要：[.claude/project/response-format.md](.claude/project/response-format.md)
- 配置项摘要：[.claude/project/configs.md](.claude/project/configs.md)
- 部署摘要：[.claude/project/deployment.md](.claude/project/deployment.md)

## 常用命令

```bash
pnpm start:dev
pnpm build
pnpm test
pnpm prisma:generate
pnpm prisma:migrate   # 会改变数据库结构，执行前确认
pnpm prisma:seed      # 会写入数据，执行前确认
pnpm db:reset         # 会重置数据库，必须明确确认
pnpm api:import       # 会同步权限数据，执行前确认
```
