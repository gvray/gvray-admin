# 编码规范

## TypeScript

- 目标版本：ES2023。
- 严格 null 检查：`strictNullChecks: true`。
- 启用装饰器元数据：`emitDecoratorMetadata: true`。
- 路径优先使用 tsconfig alias，如 `@/shared/...`。

## NestJS

- 使用构造函数注入依赖。
- 异常使用 NestJS 内置异常类：`BadRequestException`、`NotFoundException`、`ForbiddenException`、`ConflictException`。
- 全局异常由 `HttpExceptionFilter` 统一处理。
- Controller 不写业务逻辑；Service 不直接暴露未过滤的 Prisma 对象。

## 密码与敏感信息

- 密码使用 `bcrypt.hash(password, 10)` 加密存储。
- 比较使用 `bcrypt.compare(plain, hashed)`。
- 禁止在任何 API 响应中返回 `password` 字段。
- 禁止日志输出 password、token、authorization、secret、captcha、refresh token、JWT 等敏感信息原文。
- 新增日志字段时必须确认脱敏和长度限制覆盖。

## 日志与审计

- 操作日志：使用 `@OperationLog({ module, action, resource })` / `@NoOperationLog()` 配合 `OperationLogInterceptor`。
- 操作日志默认只记录写请求（`POST` / `PUT` / `PATCH` / `DELETE`），可通过 `OPLOG_ENABLED=false` 关闭。
- 操作日志敏感字段由 `OPLOG_MASK_FIELDS` 控制，默认包含 `password,oldPassword,newPassword,token,authorization,secret,captcha`。
- 登录日志由 `AuthService` 登录流程写入 `login-logs` 模块。
- 禁止裸 `console.*`，统一使用 NestJS `Logger`。
- 日志脱敏：禁止输出 `password`、`token`、`authorization`、`secret`、`captcha`、`refreshToken` 等敏感字段原文；新增日志字段须确认脱敏覆盖。
