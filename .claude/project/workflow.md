# AI 工作流

本文件用于 AI 助手按需读取，不应默认导入到上下文。

## 上下文策略

- 先定位任务涉及的模块，再读取 Controller → Service → DTO → 常量。
- 不要一次性读取 `src/`、`docs/`、根目录大文档或生成文件。
- 涉及数据库变更时，再读取 `src/prisma/schema.prisma` 和相关 seed 文件。
- 涉及 DTO / Swagger 时，再读取 [dto-swagger.md](dto-swagger.md)。
- 涉及权限时，再读取 [permissions.md](permissions.md)。

## 修改代码前

1. 阅读相关文件，理解现有模式。
2. 检查是否已有常量、工具函数、BaseService、ResponseUtil 可复用。
3. 确认接口响应不暴露敏感字段。
4. 确认 Swagger DTO 与前后端契约一致。

## 添加新模块

1. 在 `src/modules/` 下创建模块目录。
2. 参考 `users`、`roles` 等现有模块结构。
3. 在对应 Module 中导入新模块。
4. 如需 API 权限，在 Controller 方法上使用 `@RequirePermissions()`。
5. 按需执行权限扫描或导入脚本。

## 数据库变更

1. 修改 `src/prisma/schema.prisma`。
2. 运行 Prisma migration / generate。
3. 如需初始数据，更新 `src/prisma/seeds/` 下对应文件。
4. 同步 DTO、Service 查询和文档说明。

## 常见错误

- 不要在 Controller 中写业务逻辑。
- 不要直接返回 Prisma 查询结果。
- 不要返回 `password`。
- 不要暴露数据库自增 `id`。
- 不要硬编码权限字符串。
- 不要使用深层相对路径。

## 文档同步原则

只更新与本次改动直接相关的文档，避免为了“同步文档”而扩大范围。

| 改动类型 | 文档 |
|----------|------|
| 新增/删除/重命名模块 | [../../README.md](../../README.md) |
| 新增/修改 API 接口 | [../../SWAGGER_USAGE.md](../../SWAGGER_USAGE.md) 或 DTO Swagger 注解 |
| 新增/修改权限码 | [permissions.md](permissions.md) |
| 新增/修改配置项 | [configs.md](configs.md), [../../CONFIGS_ANALYSIS.md](../../CONFIGS_ANALYSIS.md) |
| 修改统一响应格式 | [response-format.md](response-format.md), [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md) |
| 修改环境变量或部署流程 | [deployment.md](deployment.md), [../../DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md) |
| 修改 AI 工作流或规则 | [../../CLAUDE.md](../../CLAUDE.md) 或本目录对应文件 |
