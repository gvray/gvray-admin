# GVRAY Admin — Claude Code 指南

本文件是 Claude Code 自动加载入口，只保留高优先级规则。详细规范按需读取，不在这里导入长文档。

## 项目概况

GVRAY Admin 是 NestJS 11 + TypeScript 后端，使用 Prisma 6 + MySQL、JWT 认证、RBAC 权限模型、Swagger/OpenAPI 和 Docker 部署。

## 关键目录

- `src/core/`：基础设施（decorators / guards / interceptors / filters / strategies）
- `src/modules/`：业务模块，系统管理模块在 `src/modules/system/`
- `src/prisma/`：Prisma Service、schema、migrations、seeds
- `src/shared/`：constants、DTO、interfaces、utils、BaseService

## 开发硬规则

- 先读相关模块文件，不要整仓读取或一次性读取大目录。
- Controller 只处理路由、鉴权、DTO、Swagger；业务逻辑放 Service。
- Service 返回统一使用 `ResponseUtil`，不要裸返回 Prisma 对象。
- DTO 字段必须有 Swagger 注解；响应 DTO 用 `@Expose()` / `@Exclude()` 控制输出。
- 禁止在任何 API 响应中返回 `password`，禁止暴露数据库自增 `id`。
- 权限码使用 `src/shared/constants/permissions.constant.ts` 常量，不硬编码字符串。
- 路径使用 tsconfig alias（如 `@/shared/...`），避免深层 `../../`。
- 涉及接口、权限、配置、响应格式、部署等行为变化时，同步更新对应文档。

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
pnpm prisma:migrate
pnpm prisma:seed
pnpm db:reset
pnpm api:import
```
