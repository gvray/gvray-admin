# 统一响应格式使用指南

所有 API 通过 `ResponseInterceptor` 自动包装为统一结构；异常由 `HttpExceptionFilter` 统一处理。Controller 只做路由/鉴权/DTO，业务逻辑放 Service。

## 响应结构

```json
// 成功
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
// 分页 — data 内仅 items/total/page/pageSize
{
  "success": true,
  "code": 200,
  "message": "查询成功",
  "data": { "items": [], "total": 100, "page": 1, "pageSize": 10 },
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 错误
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "showType": 2
}
```

> `showType` 为数值枚举：`0=静默 1=警告 2=错误消息 3=通知 4=默认 9=跳转`。

## 核心组件

| 组件 | 文件 |
|------|------|
| 响应接口 | `src/shared/interfaces/response.interface.ts` |
| 响应工具 | `src/shared/utils/response.util.ts` |
| 响应拦截器 | `src/core/interceptors/response.interceptor.ts` |
| 异常过滤器 | `src/core/filters/http-exception.filter.ts` |
| 跳过装饰器 | `src/core/decorators/skip-response-format.decorator.ts` |
| 分页 DTO | `src/shared/dtos/pagination.dto.ts` |
| 基础服务 | `src/shared/services/base.service.ts` |

## ResponseUtil 速查

```typescript
ResponseUtil.success(data, message?, code?)
ResponseUtil.created(data, message?)          // POST
ResponseUtil.updated(data, message?)          // PUT/PATCH
ResponseUtil.deleted(data, message?)          // DELETE
ResponseUtil.found(data, message?)            // GET
ResponseUtil.paginated({ items, total, page, pageSize }, message?)
ResponseUtil.error(message, code?, showType?)
ResponseUtil.badRequest/unauthorized/forbidden/notFound(message?, showType?)
```

## 使用方式

Service 直接调用 `ResponseUtil` 或使用 `BaseService` 分页方法：

```typescript
async findAll(query: QueryDto) {
  return this.paginateWithSortAndResponse(
    this.prisma.user, query, where, include, 'createdAt', '查询成功',
  );
}

async create(dto: CreateDto) {
  const record = await this.prisma.user.create({ data: dto });
  return ResponseUtil.created(record, '创建成功');
}
```

Controller 直接返回 Service 结果（已是统一格式，拦截器透传）：

```typescript
@Get()
async findAll(@Query() query: QueryDto) {
  return this.service.findAll(query);
}

@Get('export')
@SkipResponseFormat()
export() {
  return fileStream;
}
```

## 最佳实践

1. **语义化方法**：用 `created`/`updated`/`deleted`/`found` 替代裸 `success`，消息具体化如 `'用户创建成功'` 而非 `'操作成功'`。
2. **错误与序列化**：Service 层抛 NestJS 内置异常，由过滤器统一转换；返回前使用 `plainToInstance(Dto, data, { excludeExtraneousValues: true })`，禁止返回 `password` 与数据库自增 `id`。分页方法使用泛型 `paginateWithSortAndResponse<UserResponseDto>(...)`。
