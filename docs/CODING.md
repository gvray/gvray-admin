# 编码规范

> TypeScript、NestJS、密码安全、日志与审计。

---

## 一、TypeScript

- 目标版本: ES2023
- 严格 null 检查: `strictNullChecks: true`
- 启用装饰器元数据: `emitDecoratorMetadata: true`

---

## 二、NestJS

- 使用构造函数注入依赖（依赖注入）
- 异常使用 NestJS 内置异常类：`BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`
- 全局异常由 `HttpExceptionFilter` 统一处理

---

## 三、密码安全

- 密码使用 `bcrypt.hash(password, 10)` 加密存储
- 比较使用 `bcrypt.compare(plain, hashed)`
- **禁止**在任何 API 响应中返回 password 字段

---

## 四、日志与审计

- 操作日志: `@Audit('描述')` 装饰器 + `OperationLogInterceptor` 自动记录
- 审计日志: `AuditInterceptor` 记录数据变更前后的差异
- 登录日志: `AuthService` 登录时自动写入 `login-logs` 模块
