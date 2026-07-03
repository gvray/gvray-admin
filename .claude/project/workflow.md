# AI 工作流

本文件用于 AI 助手按需读取，不应默认导入到上下文。

## 上下文策略

- 先定位任务涉及的模块，再读取 Controller → Service → DTO → 常量。
- 不要一次性读取 `src/`、`docs/`、根目录大文档或生成文件。
- 涉及数据库变更时，再读取 `prisma/schema.prisma`、`prisma/seed.ts` 和 `prisma/seeds/` 下相关文件。
- 涉及 DTO / Swagger 时，再读取 [dto-swagger.md](dto-swagger.md)。
- 涉及权限时，再读取 [permissions.md](permissions.md)。
- 文档与源码/配置冲突时，以当前源码和配置为准；无法确认时标注“需确认”，不要为了适配旧文档反向改代码。

## 修改代码前

1. 阅读相关文件，理解现有模式。
2. 检查是否已有常量、工具函数、BaseService、ResponseUtil 或模块内模式可复用；存在不代表必须强行套用。
3. 确认接口响应不暴露 `password`、token、数据库自增 `id` 等敏感/内部字段。
4. 确认 Swagger DTO 与前后端契约一致。
5. 修改行为前确认是否需要同步 README、Swagger、响应、权限、配置或部署文档。

## 添加新模块

1. 在 `src/modules/` 下创建模块目录，参考 `users`、`roles`、`configs` 等现有模块结构。
2. 在对应聚合 Module 中导入新模块（系统管理模块通常在 `SystemModule`）。
3. Controller 使用合适路径、Swagger tag、DTO 和鉴权守卫。
4. 如需 API 权限，在权限常量中定义权限码，并在 Controller 方法上使用 `@RequirePermissions()` 引用常量。
5. 写操作默认受 `GuestWriteGuard` 约束；确需允许游客写入时才显式添加 `@AllowGuestWrite()`。
6. 按需添加 `@OperationLog(...)` / `@NoOperationLog()`。
7. 按需更新 seed、配置项、权限扫描/导入流程和文档说明。

## 数据库变更

1. 修改 `prisma/schema.prisma`。
2. 需要迁移时说明影响范围，确认后再运行 Prisma migration / generate。
3. 如需初始数据，更新 `prisma/seed.ts` 或 `prisma/seeds/` 下对应文件。
4. 同步 DTO、Service 查询、权限/配置 seed 和文档说明。

## 命令安全边界

- 可按需用于低风险验证：`pnpm build`、相关 `pnpm test`、只读 `grep/find/git status`。
- 执行前必须确认：`pnpm prisma:migrate`、`pnpm prisma:seed`、`pnpm db:reset`、`pnpm api:import`、部署脚本、Docker volume 清理、删除文件或重置数据的命令。
- 不要在用户未授权时操作生产环境、发布镜像、回滚部署或清空数据库。

## 常见错误

- 不要在 Controller 中写业务逻辑。
- 不要直接返回未过滤的 Prisma 查询结果。
- 不要返回 `password`、token、authorization、secret、captcha 等敏感信息。
- 不要暴露数据库自增 `id`。
- 不要硬编码权限字符串。
- 不要使用深层相对路径。
- 不要把旧文档当成事实来源；先核验当前源码。

## 文档同步原则

只更新与本次改动直接相关的文档，避免为了“同步文档”而扩大范围。易过期清单（完整路由表、权限数量、配置统计）优先指向生成来源或源码位置。

| 改动类型 | 文档 |
|----------|------|
| 新增/删除/重命名模块 | [../../README.md](../../README.md) |
| 新增/修改 API 接口 | Swagger DTO 注解；必要时更新 [../../SWAGGER_USAGE.md](../../SWAGGER_USAGE.md) 的使用说明 |
| 新增/修改权限码 | [permissions.md](permissions.md) |
| 新增/修改配置项 | [configs.md](configs.md), [../../CONFIGS_ANALYSIS.md](../../CONFIGS_ANALYSIS.md) |
| 修改统一响应格式 | [response-format.md](response-format.md), [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md) |
| 修改环境变量或部署流程 | [deployment.md](deployment.md), [../../DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md) |
| 修改 AI 工作流或规则 | [../../CLAUDE.md](../../CLAUDE.md) 或本目录对应文件 |
