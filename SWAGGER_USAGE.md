# Swagger API 文档使用说明

## 访问地址
- Swagger UI: http://localhost:8001/api
- 应用地址: http://localhost:8001

## 认证配置

### 1. 获取 JWT Token
首先需要登录获取 JWT token：

```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"123456"}'
```

响应示例：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "roles": [...]
  }
}
```

### 2. 在 Swagger UI 中配置认证

1. 打开 http://localhost:8001/api
2. 点击右上角的 **"Authorize"** 按钮（锁图标 🔒）
3. 在输入框中输入：`Bearer your_token_here`
   - 将 `your_token_here` 替换为实际的 token
   - 例如：`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. 点击 **"Authorize"** 确认
5. 关闭对话框

### 3. 测试接口

配置认证后，所有需要认证的接口都会自动携带 token，你可以：

- 展开任意接口
- 点击 **"Try it out"**
- 填写参数（如果需要）
- 点击 **"Execute"** 执行

## 接口分类

### 🔐 认证管理
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册

### 👥 用户管理
- `GET /system/users` - 获取所有用户
- `POST /system/users` - 创建用户（后台创建支持 `roleIds` 指定角色；自助注册 `/auth/register` 使用默认角色配置）
- `GET /system/users/{userId}` - 获取指定用户
- `PATCH /system/users/{userId}` - 更新用户
- `DELETE /system/users/{userId}` - 删除用户
- `POST /system/users/{userId}/reset-password` - 重置用户密码
- `PUT /system/users/{userId}/roles` - 为用户分配角色
- `DELETE /system/users/{userId}/roles` - 移除用户角色

### 🎭 角色管理
- `GET /system/roles` - 获取所有角色
- `POST /system/roles` - 创建角色
- `GET /system/roles/{roleId}` - 获取指定角色
- `PATCH /system/roles/{roleId}` - 更新角色
- `DELETE /system/roles/{roleId}` - 删除角色
- `PUT /system/roles/{roleId}/permissions` - 为角色分配权限
- `PUT /system/roles/{roleId}/data-scope` - 设置角色数据权限

### 🔑 权限管理
- `GET /system/permissions` - 获取所有权限
- `POST /system/permissions` - 创建权限
- `GET /system/permissions/{permissionId}` - 获取指定权限
- `PATCH /system/permissions/{permissionId}` - 更新权限
- `DELETE /system/permissions/{permissionId}` - 删除权限
- `POST /system/permissions/scan` - 扫描并同步 API 权限

### 🏢 部门管理
- `GET /system/departments` - 获取所有部门
- `POST /system/departments` - 创建部门
- `GET /system/departments/tree` - 获取部门树结构
- `GET /system/departments/{departmentId}` - 获取指定部门
- `PATCH /system/departments/{departmentId}` - 更新部门
- `DELETE /system/departments/{departmentId}` - 删除部门

### 💼 岗位管理
- `GET /system/positions` - 获取所有岗位
- `POST /system/positions` - 创建岗位
- `GET /system/positions/department/{departmentId}` - 获取部门岗位
- `GET /system/positions/{positionId}` - 获取指定岗位
- `PATCH /system/positions/{positionId}` - 更新岗位
- `DELETE /system/positions/{positionId}` - 删除岗位

### ⚙️ 配置管理
- `GET /system/configs` - 获取配置列表
- `POST /system/configs` - 创建配置
- `GET /system/configs/{configId}` - 获取指定配置
- `PATCH /system/configs/{configId}` - 更新配置
- `DELETE /system/configs/{configId}` - 删除配置

### 📝 字典管理
- `GET /system/dictionaries` - 获取字典列表
- `POST /system/dictionaries` - 创建字典
- `GET /system/dictionaries/{dictId}` - 获取指定字典
- `PATCH /system/dictionaries/{dictId}` - 更新字典
- `DELETE /system/dictionaries/{dictId}` - 删除字典

### 📋 菜单管理
- `GET /system/menu` - 获取菜单树
- `POST /system/menu` - 创建菜单
- `GET /system/menu/{menuId}` - 获取指定菜单
- `PATCH /system/menu/{menuId}` - 更新菜单
- `DELETE /system/menu/{menuId}` - 删除菜单

### 📊 监控
- `GET /monitor/server` - 获取服务器状态（CPU、内存、磁盘）

### 🧑 个人中心
- `GET /profile` - 获取当前用户信息
- `PATCH /profile` - 更新当前用户信息
- `POST /profile/change-password` - 修改密码
- `GET /profile/settings` - 获取个人设置
- `PATCH /profile/settings` - 更新个人设置

### 📝 日志
- `GET /system/login-logs` - 登录日志
- `GET /system/operation-logs` - 操作日志

## 默认管理员账户

- **邮箱**: admin@example.com
- **用户名**: admin
- **密码**: 123456

## 权限说明

管理员用户拥有所有权限，包括：
- 用户管理权限
- 角色管理权限
- 权限管理权限
- 部门管理权限
- 岗位管理权限

## 常见问题

### Q: 为什么接口返回 401 未授权？
A: 请确保：
1. 已经正确配置了 JWT token
2. token 格式正确（以 "Bearer " 开头）
3. token 没有过期

### Q: 为什么接口返回 403 禁止访问？
A: 请确保：
1. 用户具有相应的角色
2. 角色具有相应的权限
3. 用户状态为激活状态

### Q: 如何刷新 token？
A: 重新登录获取新的 token，然后更新 Swagger 中的认证配置。

## 开发调试

### 查看认证信息
在 Swagger UI 中，展开任意接口，可以看到：
- **Parameters** 标签页：显示认证参数
- **Responses** 标签页：显示可能的响应状态

### 测试不同权限
可以创建不同角色的用户，测试不同权限级别的接口访问。 