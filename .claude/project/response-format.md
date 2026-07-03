# 统一响应格式摘要

详细说明见 [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md)。当前实现以 `src/core/interceptors/response.interceptor.ts`、`src/shared/utils/response.util.ts` 和 `src/shared/interfaces/response.interface.ts` 为准。

## 核心约定

- 接口由全局 `ResponseInterceptor` 统一包装。
- Controller / Service 可返回业务数据或 DTO，拦截器会自动包装。
- 如果返回值已经包含 `success/code/message/data/timestamp`，拦截器不会重复包装。
- 需要自定义 message/code、分页响应或语义化响应时使用 `ResponseUtil`。
- 分页接口使用 `ResponseUtil.paginated({ items, total, page, pageSize }, message)` 或返回同结构数据后由调用层显式包装。
- 使用 `@SkipResponseFormat()` 的接口不会被统一包装，适用于文件流等特殊响应。

## 成功结构

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/system/users"
}
```

## 分页结构

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 10
  },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## 错误结构

错误由 `HttpExceptionFilter` 统一处理，常见结构：

```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "data": null,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/system/users",
  "showType": "ERROR_MESSAGE"
}
```

## 默认包装语义

`ResponseInterceptor` 会按 HTTP method 选择默认响应：

| Method | 默认方法 |
|--------|----------|
| `POST` | `ResponseUtil.created()` |
| `PUT` / `PATCH` | `ResponseUtil.updated()` |
| `DELETE` | `ResponseUtil.deleted()` |
| 其他 | `ResponseUtil.found()` |

## 错误展示类型映射

`HttpExceptionFilter` 根据状态码选择 `showType`：

| 状态码 | `showType` |
|--------|-----------|
| 401 / 403 | `NOTIFICATION` |
| 400 / 422 / 409 | `ERROR_MESSAGE` |
| 404 | `WARN_MESSAGE` |
| 500 / 503 | `NOTIFICATION` |

## 修改响应格式时

1. 检查 `ResponseUtil`。
2. 检查 `ResponseInterceptor`。
3. 检查 `HttpExceptionFilter` 输出是否仍一致。
4. 同步 [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md)。
5. 同步相关 Swagger 响应示例，避免示例绕过统一 envelope。
