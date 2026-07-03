# 权限规范

## 权限码

- 常量位置：`src/shared/constants/permissions.constant.ts`。
- 命名规范：`{module}:{resource}:{action}`。
- 示例：`system:user:create`、`system:role:update`。
- Controller 中使用常量，不硬编码权限字符串。
- 不在文档中写死权限总数；以权限常量、扫描报告或数据库当前状态为准。

## Controller 用法

```typescript
@Post()
@RequirePermissions(USER_PERMISSIONS.CREATE)
async create() {}
```

系统管理模块通常配合：

```typescript
@UseGuards(JwtAuthGuard, GuestWriteGuard, RolesGuard, PermissionsGuard)
```

说明：`JwtAuthGuard`、`GuestWriteGuard`、`RolesGuard`、`PermissionsGuard` 均是 Controller/路由级使用；全局守卫只有 `FeatureFlagGuard`。

## 权限扫描

- API 权限由 Controller 元数据扫描生成。
- 可调用 `POST /system/permissions/scan`。
- 项目也提供 `pnpm api:import` 脚本用于导入/同步权限。
- 运行扫描/导入会改变权限数据，执行前应明确确认。
- 启动时权限同步/报告逻辑以当前 `ApiPermissionSyncService`、`PermissionsScannerService` 实现为准，不手改生成报告。

## 新增权限检查清单

1. 在权限常量中定义新权限码。
2. Controller 方法使用 `@RequirePermissions(...)` 引用常量。
3. Swagger 说明与接口行为一致。
4. 按需运行权限扫描或导入流程。
5. 检查角色默认权限、seed、菜单/按钮展示是否受影响。
6. 检查 guest 角色是否只展示能力，写保护是否仍由 `GuestWriteGuard` 兜底。

## guest 角色

`guest` 保留权限点用于前端菜单和按钮展示。后端写操作限制不通过裁剪权限实现，而由 `GuestWriteGuard` 在 Controller 级拦截 `POST` / `PUT` / `PATCH` / `DELETE`。确需允许游客写入的接口必须显式添加 `@AllowGuestWrite()`，并在代码评审中说明原因。

## 功能开关

`FeatureFlagGuard` 是全局守卫，但只对标记了 `@FeatureFlag(...)` 的路由生效。例如注册接口受 `@FeatureFlag('register', '注册功能已关闭')` 控制。新增功能开关时同步 [configs.md](configs.md) 和 seed 配置。

## 菜单权限与 API 权限分离

`AuthService.getCurrentUser` 会过滤掉 `type === 'API'` 的权限，前端只拿到菜单/按钮权限，不暴露纯 API 权限。这意味着：

- 前端菜单/按钮渲染使用过滤后的权限列表。
- 后端 API 鉴权仍通过 `PermissionsGuard` 检查完整的 `@RequirePermissions` 声明。
- 新增纯 API 权限（无菜单/按钮对应）时，前端不会渲染相关 UI，但后端仍需正确鉴权。
