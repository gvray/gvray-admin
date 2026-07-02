# 权限规范

## 权限码

- 常量位置：`src/shared/constants/permissions.constant.ts`。
- 命名规范：`{module}:{resource}:{action}`。
- 示例：`system:user:create`、`system:role:update`。
- Controller 中使用常量，不硬编码权限字符串。

## Controller 用法

```typescript
@Post()
@RequirePermissions(USER_PERMISSIONS.CREATE)
async create() {}
```

系统管理模块通常配合：

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
```

## 权限扫描

- API 权限由 Controller 元数据扫描生成。
- 可调用 `POST /system/permissions/scan`。
- 项目也提供 `pnpm api:import` 脚本用于导入/同步权限。

## 新增权限检查清单

1. 在权限常量中定义新权限码。
2. Controller 方法使用 `@RequirePermissions(...)` 引用常量。
3. Swagger 说明与接口行为一致。
4. 运行权限扫描或导入流程。
5. 如涉及角色默认权限，检查权限分配逻辑和 seed。

## guest 角色

`guest` 保留全部权限点用于前端菜单和按钮展示。后端写操作限制不通过裁剪权限实现，而由全局 `GuestWriteGuard` 在运行时拦截 `POST` / `PUT` / `PATCH` / `DELETE`。确需允许游客写入的接口必须显式添加 `@AllowGuestWrite()`。