# 配置项摘要

详细分析见 [../../CONFIGS_ANALYSIS.md](../../CONFIGS_ANALYSIS.md)。使用配置项前请以当前源码、seed 和 `ConfigsService` / `ConfigsRuntimeController` 实现为准。

## 配置来源

- Seed 数据主要在 `prisma/seeds/configs.ts`。
- 运行时读取通过 `ConfigsService` 完成；公开配置通过 `GET /public/runtime-config` 暴露给前端（仅 `isPublic=true` 且 `status=enabled`）。
- 配置项实际是否被后端业务读取，要查看具体 Service/Controller，不要仅凭 seed 存在就判定“已实装”。

## 修改配置项时

1. 明确配置 key、类型、默认值、是否公开给前端。
2. 同步 seed 注释和用途说明。
3. 如需前端读取，确认 `isPublic` 和 group 字段。
4. 如需后端读取，检查 `ConfigsService` 或 `isFeatureEnabled()` 等是否已接入；避免只加配置不接业务。
5. 同步 [../../CONFIGS_ANALYSIS.md](../../CONFIGS_ANALYSIS.md) 并在其中标注核验日期。

## 功能开关（Feature Flag）

`FeatureFlagGuard` 是全局守卫，只对标记了 `@FeatureFlag(...)` 的路由生效：

- 示例：`@FeatureFlag('register', '注册功能已关闭')`。
- 后端通过 `ConfigsService.isFeatureEnabled(key)` 读取 `feature.${key}` 配置。
- 当前已知已接入后端的功能开关：
  - `feature.register`（控制 `/auth/register` 是否开放）
  - `feature.registerDefaultRole`（控制自助注册用户默认角色）
- 新增功能开关时，同步 seed、权限/文档说明和前端初始化逻辑。

## 已知待对齐项

- `CONFIGS_ANALYSIS.md` 需定期与源码和 seed 核验，避免配置状态标注过时。
