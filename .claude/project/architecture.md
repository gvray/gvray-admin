# 架构约定

本文件保留架构总则。DTO / Swagger 详细示例见 [dto-swagger.md](dto-swagger.md)。

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

## Controller

- 系统管理模块路径使用 `system/...` 前缀。
- Controller 负责路由、鉴权、参数 DTO、Swagger 装饰器和调用 Service。
- 不在 Controller 中写业务逻辑。
- 受保护接口使用 `JwtAuthGuard`，需要角色/权限时使用 `RolesGuard`、`PermissionsGuard`。

## 权限控制

- 权限装饰器：`@RequirePermissions(USER_PERMISSIONS.CREATE)`。
- 权限常量：`src/shared/constants/permissions.constant.ts`。
- 命名规范：`{module}:{resource}:{action}`，如 `system:user:create`。
- 自动扫描：`POST /system/permissions/scan` 或项目权限导入脚本。
- `guest` 保留全部权限点用于前端菜单/按钮展示，写操作由全局 `GuestWriteGuard` 运行时拦截；确需允许游客写入的接口显式添加 `@AllowGuestWrite()`。

详见 [permissions.md](permissions.md)。

## 统一响应

Service 层使用 `ResponseUtil` 构建响应，接口由 `ResponseInterceptor` 统一包装。

常用方法：

| 方法 | 场景 |
|------|------|
| `ResponseUtil.success(data, message)` | 通用成功 |
| `ResponseUtil.created(data, message)` | 创建成功 |
| `ResponseUtil.updated(data, message)` | 更新成功 |
| `ResponseUtil.deleted(data, message)` | 删除成功 |
| `ResponseUtil.found(data, message)` | 查询成功 |
| `ResponseUtil.paginated(pageData, message)` | 分页查询 |

详见 [response-format.md](response-format.md) 和 [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md)。

## Prisma 查询

- 查询用户等敏感对象时主动排除 `password`。
- 关联查询使用明确的 `include` / `select`。
- 多表写入或强一致场景使用 `this.prisma.$transaction([...])`。
- 返回响应前使用 DTO / `plainToInstance()` 控制输出结构。

## DTO 总则

- DTO 是前后端契约，所有字段必须有 Swagger 注解。
- 必填字段用 `@ApiProperty()`，可选字段用 `@ApiPropertyOptional()` 并搭配 `@IsOptional()`。
- 响应 DTO 使用 `@Expose()` / `@Exclude()` 控制输出。
- 响应 DTO 不暴露数据库自增 `id` 和 `password`。
- 嵌套对象用 `@Type()`，字段转换用 `@Transform()`。

详见 [dto-swagger.md](dto-swagger.md)。
