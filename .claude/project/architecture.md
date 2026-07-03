# 架构约定

本文件保留架构总则。DTO / Swagger 详细示例见 [dto-swagger.md](dto-swagger.md)，权限细节见 [permissions.md](permissions.md)，统一响应细节见 [response-format.md](response-format.md)。

## 模块结构

业务模块通常包含：

```text
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── dto/
└── module-name-response.dto.ts
```

## 路径别名

使用 `tsconfig.json` 路径别名，避免深层相对路径：

| 别名 | 路径 |
|------|------|
| `@/*` | `src/*` |
| `@/core/*` | `src/core/*` |
| `@/shared/*` | `src/shared/*` |
| `@/modules/*` | `src/modules/*` |
| `@/prisma/*` | `src/prisma/*` |
| `@/config/*` | `src/config/*` |

## 关键目录

- `src/prisma/`：Nest Prisma Module / PrismaService（`@Global()`，任何模块可直接注入）。
- `prisma/`：`schema.prisma`（使用 `relationMode = "prisma"`，数据库无外键约束，级联由 Prisma 客户端保证）、`seed.ts`、`seeds/`、migrations（如存在）。
- `src/shared/services/base.service.ts`：通用分页/查询辅助，按现有模块模式复用，不强制所有 Service 继承。

## Controller

- 系统管理模块路径使用 `system/...` 前缀。
- Controller 负责路由、鉴权、参数 DTO、Swagger 装饰器和调用 Service。
- 不在 Controller 中写业务逻辑。
- 受保护接口显式使用 `JwtAuthGuard`；需要角色/权限时使用 `RolesGuard`、`PermissionsGuard`。
- 系统管理 Controller 统一使用 `@UseGuards(JwtAuthGuard, GuestWriteGuard, RolesGuard, PermissionsGuard)`，`GuestWriteGuard` 拦截 guest 写操作。
- `FeatureFlagGuard` 是全局守卫，只对标记了 `@FeatureFlag(...)` 的路由生效。
- 获取当前用户统一使用 `@CurrentUser()`，不要直接从 `req.user` 读取。
- 如需跳过操作日志，使用 `@NoOperationLog()`。

## 权限控制

- 权限装饰器：`@RequirePermissions(USER_PERMISSIONS.CREATE)`。
- 权限常量：`src/shared/constants/permissions.constant.ts`。
- 命名规范：`{module}:{resource}:{action}`，如 `system:user:create`。
- `guest` 保留权限点用于前端菜单/按钮展示，写操作由 `GuestWriteGuard` 在 Controller 级拦截 `POST` / `PUT` / `PATCH` / `DELETE`；确需允许游客写入的接口显式添加 `@AllowGuestWrite()`。
- `super_admin` 不绕过 `PermissionsGuard`，也要通过权限码匹配。

详见 [permissions.md](permissions.md)。

## 统一响应

- 全局 `ResponseInterceptor` 会把 Controller 返回的业务数据包装成统一响应。
- 如果返回值已经包含 `success/code/message/data/timestamp`，不会重复包装。
- `ResponseUtil` 用于显式语义化响应、自定义 message/code、分页和异常过滤器输出。
- Service 默认返回业务数据/DTO；不要直接返回未过滤的 Prisma 对象。

详见 [response-format.md](response-format.md) 和 [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md)。

## Prisma 查询

- 查询用户等敏感对象时优先使用 `select` 主动排除 `password`、内部自增 `id` 等字段。
- 关联查询使用明确的 `include` / `select`，避免把数据库模型整体暴露给 API。
- 多表写入或强一致场景使用 `this.prisma.$transaction(...)`。
- 返回响应前使用 DTO / `plainToInstance(..., { excludeExtraneousValues: true })` 或项目既有等效模式控制输出结构。

## DTO 与验证

- DTO 是前后端契约，所有字段必须有 Swagger 注解。
- 必填字段用 `@ApiProperty()`，可选字段用 `@ApiPropertyOptional()` 并搭配 `@IsOptional()`。
- 响应 DTO 使用 `@Expose()` / `@Exclude()` 控制输出，并确保实际转换生效。
- 响应 DTO 不暴露数据库自增 `id` 和 `password`。
- 嵌套对象用 `@Type()`，字段转换用 `@Transform()`。
- 全局启用 `EmptyStringTransformPipe`（将 body 中空字符串转为 `null`）和 `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`：新增入参字段必须进入 DTO，额外字段会被拒绝；空字符串→`null` 对 Prisma 更新有意义（`null` 会写入，`undefined` 会被忽略）。

详见 [dto-swagger.md](dto-swagger.md)。

## 分页与查询

- 分页参数使用 `PaginationDto` / `PaginationSortDto`，`pageSize` 上限 100。
- 查询条件构建优先复用 `BaseService.buildWhere({ contains, equals, boolean, date })`：
  - `contains`：模糊查询
  - `equals`：精确匹配
  - `boolean`：字符串 `'true'/'1'` 转布尔
  - `date`：按天范围（gte startOfDay / lte endOfDay）
