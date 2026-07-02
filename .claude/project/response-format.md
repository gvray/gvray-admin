# 统一响应格式摘要

详细说明见 [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md)。

## 核心约定

- 接口由 `ResponseInterceptor` 统一包装。
- Service 层使用 `ResponseUtil` 构建语义化响应。
- 分页接口使用 `ResponseUtil.paginated()`。
- 查询单条使用 `ResponseUtil.found()`。
- 创建、更新、删除分别使用 `created()`、`updated()`、`deleted()`。

## 常见结构

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/system/users"
}
```

## 修改响应格式时

1. 检查 `ResponseUtil`。
2. 检查 `ResponseInterceptor`。
3. 检查异常过滤器输出是否仍一致。
4. 同步 [../../UNIFIED_RESPONSE_GUIDE.md](../../UNIFIED_RESPONSE_GUIDE.md)。