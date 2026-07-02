# 配置项摘要

详细分析见 [../../CONFIGS_ANALYSIS.md](../../CONFIGS_ANALYSIS.md)。

## 配置来源

- Seed 数据主要在 `src/prisma/seeds/configs.ts`。
- 运行时读取通常通过配置相关 Service 或模块完成。

## 修改配置项时

1. 明确配置 key、类型、默认值、是否公开给前端。
2. 同步 seed 注释和用途说明。
3. 检查前端是否需要读取该配置。
4. 检查后端是否已有读取逻辑，避免只加配置不接业务。
5. 同步 [../../CONFIGS_ANALYSIS.md](../../CONFIGS_ANALYSIS.md)。