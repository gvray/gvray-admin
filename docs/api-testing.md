# API 测试指南

## Swagger UI 调试

服务启动后，访问 Swagger UI 进行接口调试：

```
http://localhost:3000/api
```

点击「Authorize」输入登录接口返回的 `accessToken`（格式：`Bearer xxx`）即可测试受保护接口。

## 默认测试账户

| 角色 | 用户名 | 邮箱 | 密码 |
|------|--------|------|------|
| 超级管理员 | `super_admin` | `super@example.com` | `123456`（可通过 `SUPER_ADMIN_INITIAL_PASSWORD` 覆盖） |
| 管理员 | `admin` | `admin@example.com` | `123456`（可通过 `SUPER_ADMIN_INITIAL_PASSWORD` 覆盖） |
| 游客 | `guest` | `guest@example.com` | `123456` |

> 注册接口受 `feature.register` 配置控制，默认关闭（seed 中值为 `false`），可在系统配置中开启。
