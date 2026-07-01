# AI 编程指南

> 面向 Claude Code / Cursor / Copilot 等 AI 编程助手的开发工作流指南。

---

## 一、使用 `@` 符号引用上下文

Claude Code / Cursor 等现代 AI IDE 支持 `@` 符号引用文件或目录，快速将相关代码纳入上下文：

```
@src/modules/system/users/users.controller.ts   # 引用单个文件
@src/modules/system/users/                      # 引用整个目录
@prisma/schema.prisma                           # 引用 Prisma Schema
@docs/ARCHITECTURE.md                           # 引用架构规范文档
```

**最佳实践**：
- 修改某个模块前，先 `@模块目录` 让 AI 读取全部相关文件
- 涉及数据库变更时，`@prisma/schema.prisma` + `@prisma/seeds/`
- 不要 `@src/` 整个项目（上下文太长），精准定位到相关模块

---

## 二、修改代码前

1. **阅读相关文件**：先看 Controller → Service → DTO，理解现有逻辑
2. **检查权限常量**：如需新增权限，先在 `permissions.constant.ts` 定义
3. **遵循响应格式**：Service 返回使用 `ResponseUtil.xxx()`，不要裸返回
4. **更新 Swagger**：DTO 添加 `@ApiProperty()` / `@ApiPropertyOptional()`

---

## 三、添加新模块

1. 在 `src/modules/` 下创建模块目录
2. 复制现有模块结构（参考 `users` 或 `roles`）
3. 在 `AppModule` 或 `SystemModule` 中导入新模块
4. 如需 API 权限，在 Controller 方法上加 `@RequirePermissions()`
5. 运行 `pnpm prisma:seed` 或调用 `POST /system/permissions/scan`

---

## 四、数据库变更

1. 修改 `prisma/schema.prisma`
2. 运行 `pnpm prisma:migrate` 生成迁移文件
3. 如需 seed 数据，更新 `prisma/seeds/` 下的对应文件
4. 运行 `pnpm prisma:generate` 重新生成 Prisma Client

---

## 五、避免的错误

- ❌ 不要直接返回 Prisma 查询结果（裸对象），用 `plainToInstance()` + DTO 转换
- ❌ 不要在 Controller 中写业务逻辑，全部放到 Service
- ❌ 不要返回 password 字段，查询时主动 select 排除
- ❌ 不要硬编码权限字符串，使用 `permissions.constant.ts` 中的常量
- ❌ 不要使用相对路径 `../../`，使用路径别名 `@/shared/...`

---

## 六、代码变更时同步更新文档

**改代码必须同步更新对应的文档**，禁止代码和文档不一致。

| 改了什么 | 必须更新的文档 | 更新内容 |
|---------|--------------|---------|
| 新增/删除/重命名模块 | `README.md` | 项目结构、功能清单 `[x]`/`[ ]` |
| 新增/修改 API 接口 | `SWAGGER_USAGE.md` | 接口路径、请求参数说明 |
| 新增/修改权限码 | `PERMISSIONS_USAGE.md` | 权限常量用法示例 |
| 新增/修改配置项 (`prisma/seeds/configs.ts`) | `CONFIGS_ANALYSIS.md` | 该配置的前后端关联分析 |
| 新增/修改 Seed 数据 | 对应 seed 文件的注释 | 数据用途说明 |
| 修改 `.env.example` | `DOCKER_DEPLOYMENT.md` | 环境变量说明 |
| 修改响应格式 / 新增 `ResponseUtil` 方法 | `UNIFIED_RESPONSE_GUIDE.md` | 用法示例 |
| 修改 `CLAUDE.md` 或子文档的约定 | `CLAUDE.md` / 对应子文档 | 自我更新 |

**规则**：
- 一个 PR / Commit 里，代码改动和文档改动同时提交
- 如果不确定文档是否需要更新，默认更新
- 删除功能时，同步删除文档中对应的描述，不要留死链
