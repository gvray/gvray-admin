# AI 工作流

## 上下文策略

- 先定位任务涉及的模块，再读取 Controller → Service → DTO → 常量。
- 不要一次性读取 `src/`、`docs/`、根目录大文档或生成文件。
- 涉及数据库变更时，再读取 `prisma/schema.prisma`、seed 和 seeds/ 下相关文件。
- 文档与源码/配置冲突时，以当前源码和配置为准；无法确认时标注“需确认”。

## 修改代码前

1. 阅读相关文件，理解现有模式。
2. 检查是否已有常量、工具函数、BaseService、ResponseUtil 或模块内模式可复用。
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
