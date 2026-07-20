# 权限规范

## 权限码

- 常量位置：`src/shared/constants/permissions.constant.ts`
- 命名规范：`{module}:{resource}:{action}`，如 `system:user:create`
- Controller 中使用常量，不硬编码权限字符串
- 不在文档中写死权限总数；以权限常量、扫描报告或数据库当前状态为准

## Controller 用法

```typescript
@Post()
@RequirePermissions(USER_PERMISSIONS.CREATE)
async create() {}
```

系统管理模块通常配合 `@UseGuards(JwtAuthGuard, GuestWriteGuard, RolesGuard, PermissionsGuard)`。`JwtAuthGuard`、`GuestWriteGuard`、`RolesGuard`、`PermissionsGuard` 均是 Controller/路由级使用；全局守卫只有 `FeatureFlagGuard`（见 [architecture.md](architecture.md) 和 [configs.md](configs.md)）。

## 权限扫描

- API 权限由 Controller 元数据扫描生成；可调用 `POST /system/permissions/scan`。
- 项目提供 `pnpm api:import` 脚本用于导入/同步权限。
- 运行扫描/导入会改变权限数据，执行前应明确确认。

## 新增权限检查清单

1. 在权限常量中定义新权限码。
2. Controller 方法使用 `@RequirePermissions(...)` 引用常量。
3. Swagger 说明与接口行为一致。
4. 按需运行权限扫描或导入流程。
5. 检查角色默认权限、seed、菜单/按钮展示是否受影响。
6. 检查 guest 角色是否只展示能力，写保护是否仍由 `GuestWriteGuard` 兜底。

## 菜单权限与 API 权限分离

`AuthService.getCurrentUser` 会过滤掉 `type === 'API'` 的权限，前端只拿到菜单/按钮权限，不暴露纯 API 权限。后端 API 鉴权仍通过 `PermissionsGuard` 检查完整的 `@RequirePermissions` 声明。
