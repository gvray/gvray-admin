# 编码规范

## TypeScript

- 目标版本：ES2023，`strictNullChecks: true`，`emitDecoratorMetadata: true`。
- 路径优先使用 tsconfig alias，如 `@/shared/...`。

## NestJS

- 使用构造函数注入依赖。
- 异常使用 NestJS 内置异常类：`BadRequestException`、`NotFoundException`、`ForbiddenException`、`ConflictException`。
- 全局异常由 `HttpExceptionFilter` 统一处理。
- Controller 不写业务逻辑；Service 不直接暴露未过滤的 Prisma 对象。

## 密码与敏感信息

- 密码使用 `bcrypt.hash(password, 10)` 加密存储，比较使用 `bcrypt.compare(plain, hashed)`。
- 禁止在任何 API 响应或日志中返回 `password`、token、authorization、secret、captcha、refresh token、JWT 等敏感信息原文。
- 新增日志字段时必须确认脱敏和长度限制覆盖。

## 日志与审计

- 操作日志：使用 `@OperationLog({ module, action, resource })` / `@NoOperationLog()` 配合 `OperationLogInterceptor`。
- 操作日志默认只记录写请求（`POST` / `PUT` / `PATCH` / `DELETE`），可通过 `OPLOG_ENABLED=false` 关闭。
- 操作日志敏感字段由 `OPLOG_MASK_FIELDS` 控制，默认包含 `password,oldPassword,newPassword,token,authorization,secret,captcha`。
- 登录日志由 `AuthService` 登录流程写入 `login-logs` 模块。
- 禁止裸 `console.*`，统一使用 NestJS `Logger`。

## 功能开关缓存

`ConfigsService` 支持功能开关运行时读取与缓存。新增功能开关时：seed 中定义 `feature.xxx`；Controller 路由使用 `@FeatureFlag('xxx', '提示消息')`；后端逻辑使用 `ConfigsService.isFeatureEnabled('xxx')`。

## 语言与提交

- 错误信息、Swagger 描述、日志 message 统一使用英文。
- 提交使用 conventional commits：`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`。
