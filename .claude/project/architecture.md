# 架构约定

本文件保留架构总则。DTO / Swagger 示例见 [dto-swagger.md](dto-swagger.md)，权限细节见 [permissions.md](permissions.md)，统一响应见 [response-format.md](response-format.md)。

## 模块结构

业务模块通常包含：`module-name.module.ts`、`controller.ts`、`service.ts`、`dto/`、`response.dto.ts`。

## 路径别名

使用 tsconfig alias：`@/*` → `src/*`，`@/core/*` / `@/shared/*` / `@/modules/*` / `@/prisma/*` 等同理。禁止深层相对路径。

## 关键目录

- `src/prisma/`：Nest Prisma Module / PrismaService（`@Global()`）。
- `prisma/`：`schema.prisma`（`relationMode = "prisma"`，无外键约束）、seed.ts、seeds/、migrations。
- `src/shared/services/base.service.ts`：通用分页/查询辅助，按现有模式复用，不强制继承。

## Controller

- 系统管理模块路径使用 `system/...` 前缀。
- 不在 Controller 中写业务逻辑。
- 受保护接口显式使用 `JwtAuthGuard`；需要角色/权限时使用 `RolesGuard`、`PermissionsGuard`。
- 系统管理 Controller 统一使用 `@UseGuards(JwtAuthGuard, GuestWriteGuard, RolesGuard, PermissionsGuard)`，读取类监控接口可省略 `RolesGuard`。
- `FeatureFlagGuard` 是全局守卫，只对标记了 `@FeatureFlag(...)` 的路由生效。
- 获取当前用户统一使用 `@CurrentUser()`，不要直接从 `req.user` 读取。
- 如需跳过操作日志，使用 `@NoOperationLog()`。

## 权限控制

权限装饰器：`@RequirePermissions(USER_PERMISSIONS.CREATE)`。权限常量：`src/shared/constants/permissions.constant.ts`。命名：`{module}:{resource}:{action}`。`super_admin` 不绕过 `PermissionsGuard`。

详见 [permissions.md](permissions.md)。

## 统一响应

全局 `ResponseInterceptor` 把 Controller 返回的业务数据包装成统一响应。如果返回值已含 `success/code/message/data/timestamp`，不会重复包装。`ResponseUtil` 用于显式语义化响应、自定义 message/code、分页和异常过滤器输出。Service 默认返回业务数据/DTO。

详见 [response-format.md](response-format.md)。

## Prisma 查询

- 查询用户等敏感对象时优先使用 `select` 主动排除 `password`、内部自增 `id`。
- 关联查询使用明确的 `include` / `select`，避免把数据库模型整体暴露给 API。
- 多表写入或强一致场景使用 `this.prisma.$transaction(...)`。
- 返回响应前使用 DTO / `plainToInstance(..., { excludeExtraneousValues: true })` 控制输出结构。

## DTO 与验证

- DTO 是前后端契约，所有字段必须有 Swagger 注解。
- 必填字段用 `@ApiProperty()`，可选字段用 `@ApiPropertyOptional()` 并搭配 `@IsOptional()`。
- 响应 DTO 使用 `@Expose()` / `@Exclude()` 控制输出，不暴露数据库自增 `id` 和 `password`。
- 嵌套对象用 `@Type()`，字段转换用 `@Transform()`。
- 全局启用 `EmptyStringTransformPipe` 和 `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`：新增入参字段必须进入 DTO，额外字段会被拒绝；空字符串→`null` 对 Prisma 更新有意义。

详见 [dto-swagger.md](dto-swagger.md)。

## 分页与查询

- 分页参数使用 `PaginationDto` / `PaginationSortDto`，`pageSize` 上限 100。
- 查询条件构建优先复用 `BaseService.buildWhere({ contains, equals, boolean, date })`。
