# AI Project Knowledge Index

本目录仅面向 AI 编程助手，作为按需知识库使用。根目录 [../../CLAUDE.md](../../CLAUDE.md) 是自动加载入口，应保持短小稳定；本目录文件不要默认全量读取。

## 任务到文档映射

| 任务 | 先读 |
|------|------|
| 新增/重构业务模块 | [architecture.md](architecture.md), [dto-swagger.md](dto-swagger.md), [permissions.md](permissions.md) |
| 修改 DTO / Swagger | [dto-swagger.md](dto-swagger.md) |
| 修改权限码 / 权限扫描 | [permissions.md](permissions.md) |
| 修改统一响应格式 | [response-format.md](response-format.md), [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md) |
| 修改配置项或 seed 配置 | [configs.md](configs.md), [../../CONFIGS_ANALYSIS.md](../../CONFIGS_ANALYSIS.md) |
| 修改部署、Docker、环境变量 | [deployment.md](deployment.md), [../../DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md) |
| 修改密码、日志、审计、安全策略 | [coding.md](coding.md) |

## 文档边界

- `CLAUDE.md`：自动加载，只放硬规则和索引。
- `.claude/project/`：AI 助手按需知识库，不是产品文档。
- `docs/`：保留给未来产品/API/用户/部署文档；当前旧 AI 文档只保留兼容入口。
- 根目录长文档：暂时保留，后续需要建设正式文档站时再迁移。
