# DTO 与 Swagger 规范

DTO 是前后端契约，字段、必填状态、类型和响应结构必须通过 Swagger 明确表达。

## Swagger 注解规则

| 场景 | 注解 | 要求 |
|------|------|------|
| 必填字段 | `@ApiProperty()` | 必须有 `description`，建议有 `example` |
| 可选字段 | `@ApiPropertyOptional()` | 必须配合 `@IsOptional()` |
| 字符串 | `type: 'string'` | 建议给 example |
| 整数 | `type: 'integer'` | 使用 `@IsInt()` |
| 布尔 | `type: 'boolean'` | 使用 `@IsBoolean()` |
| 数组 | `type: [String]` / `[Number]` | 校验 `each: true` |
| 枚举 | `enum: SomeEnum` | example 使用枚举值 |
| 日期时间 | `type: 'string', format: 'date-time'` | 响应中常见 |
| 嵌套对象 | `type: XxxResponseDto` | 响应用 `@Type()` |
| 嵌套数组 | `type: [XxxResponseDto]` | 响应用 `@Type()` |

## 请求 DTO

```typescript
export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'admin', type: 'string' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'admin@example.com', type: 'string' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '状态', enum: UserStatus, example: UserStatus.ENABLED })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiPropertyOptional({ description: '角色ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}
```

## Update DTO

Update DTO 通常继承 Create DTO，并排除不可修改字段：

```typescript
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
```

## Query DTO

Query DTO 通常继承分页 DTO，查询条件全部可选：

```typescript
export class QueryUserDto extends PaginationSortDto {
  @ApiPropertyOptional({ description: '关键词', type: 'string' })
  @IsOptional()
  keyword?: string;
}
```

## 响应 DTO

响应 DTO 必须精确控制输出：

1. 每个字段必须有 `@ApiProperty()` 或 `@ApiPropertyOptional()`。
2. 暴露字段用 `@Expose()`，隐藏字段用 `@Exclude()`。
3. 数据库自增 `id` 必须排除，对外暴露业务 UUID。
4. 敏感字段（尤其 `password`）不能出现在响应 DTO 中。
5. 嵌套对象用 `@Type(() => XxxResponseDto)`。
6. 需要兼容 `null` 或转换 Prisma 关联结构时使用 `@Transform()`。

```typescript
export class UserResponseDto {
  @ApiProperty({ description: '数据库ID', type: 'integer' })
  @Exclude()
  id: number;

  @ApiProperty({ description: '用户ID', type: 'string' })
  @Expose()
  userId: string;

  @ApiPropertyOptional({ description: '邮箱', type: 'string' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  email?: string;

  @ApiProperty({ description: '创建时间', type: 'string', format: 'date-time' })
  @Expose()
  createdAt: Date;
}
```

## 禁止事项

- 禁止 DTO 裸字段没有 Swagger 注解。
- 禁止必填字段使用 `@ApiPropertyOptional()`。
- 禁止数组、枚举、数字、布尔、日期不标 `type` 或 `enum`。
- 禁止响应 DTO 出现 `password`。
- 禁止响应 DTO 对外暴露数据库自增 `id`。
