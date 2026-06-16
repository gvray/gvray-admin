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
- `GET /users` - 获取所有用户
- `POST /users` - 创建用户
- `GET /users/{id}` - 获取指定用户
- `PATCH /users/{id}` - 更新用户
- `DELETE /users/{id}` - 删除用户
- `POST /users/{id}/roles` - 为用户分配角色
- `DELETE /users/{id}/roles` - 移除用户角色

### 🎭 角色管理
- `GET /roles` - 获取所有角色
- `POST /roles` - 创建角色
- `GET /roles/{id}` - 获取指定角色
- `PATCH /roles/{id}` - 更新角色
- `DELETE /roles/{id}` - 删除角色
- `POST /roles/{id}/permissions` - 为角色分配权限
- `DELETE /roles/{id}/permissions` - 移除角色权限

### 🔑 权限管理
- `GET /permissions` - 获取所有权限
- `POST /permissions` - 创建权限
- `GET /permissions/{id}` - 获取指定权限
- `PATCH /permissions/{id}` - 更新权限
- `DELETE /permissions/{id}` - 删除权限

### 🏢 部门管理
- `GET /departments` - 获取所有部门
- `POST /departments` - 创建部门
- `GET /departments/tree` - 获取部门树结构
- `GET /departments/{id}` - 获取指定部门
- `PATCH /departments/{id}` - 更新部门
- `DELETE /departments/{id}` - 删除部门

### 💼 岗位管理
- `GET /positions` - 获取所有岗位
- `POST /positions` - 创建岗位
- `GET /positions/department/{departmentId}` - 获取部门岗位
- `GET /positions/{id}` - 获取指定岗位
- `PATCH /positions/{id}` - 更新岗位
- `DELETE /positions/{id}` - 删除岗位

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