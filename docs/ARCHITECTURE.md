# 架构约定

> 模块结构、路径别名、Controller / Service / DTO 规范、权限控制、统一响应格式、Prisma 查询规范。

---

## 一、模块规范

每个业务模块必须包含：

```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── dto/
│   ├── create-module-name.dto.ts
│   ├── update-module-name.dto.ts
│   └── query-module-name.dto.ts
└── module-name-response.dto.ts   # 响应 DTO（Swagger 用）
```

---

## 二、路径别名

使用 `tsconfig.json` 中定义的路径别名，禁止相对路径 `../../`：

| 别名 | 对应路径 |
|------|---------|
| `@/*` | `src/*` |
| `@/core/*` | `src/core/*` |
| `@/shared/*` | `src/shared/*` |
| `@/modules/*` | `src/modules/*` |
| `@/prisma/*` | `src/prisma/*` |
| `@/config/*` | `src/config/*` |

---

## 三、Controller 规范

```typescript
@ApiTags('模块中文名')
@Controller('system/modules')        // system 前缀用于系统管理模块
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class ModulesController {
  // GET 列表  → ResponseUtil.paginated()
  // GET 单条  → ResponseUtil.found()
  // POST 创建 → ResponseUtil.created()
  // PATCH 更新 → ResponseUtil.updated()
  // DELETE 删除 → ResponseUtil.deleted()
}
```

---

## 四、权限控制

- **权限装饰器**: `@RequirePermissions(USER_PERMISSIONS.CREATE)`
- **权限常量**: `src/shared/constants/permissions.constant.ts`
- **命名规范**: `{module}:{resource}:{action}`，如 `system:user:create`
- **自动扫描**: `POST /system/permissions/scan` 自动从 Controller 元数据生成 API 权限

---

## 五、统一响应格式

所有接口返回统一结构（由 `ResponseInterceptor` 自动包装）：

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

Service 层使用 `ResponseUtil` 构建响应：

| 方法 | 场景 |
|------|------|
| `ResponseUtil.success(data, message)` | 通用成功 |
| `ResponseUtil.created(data, message)` | 创建成功 |
| `ResponseUtil.updated(data, message)` | 更新成功 |
| `ResponseUtil.deleted(data, message)` | 删除成功 |
| `ResponseUtil.found(data, message)` | 查询成功 |
| `ResponseUtil.paginated(pageData, message)` | 分页查询 |

---

## 六、Prisma 查询规范

- **禁止返回 password**: Controller / Service 查询时 select 排除 `password` 字段
- **关联查询**: 使用 `include` / `select` 明确指定返回字段
- **事务**: 多表操作使用 `this.prisma.$transaction([...])`

---

## 七、DTO 规范

DTO 是**前后端契约**，所有字段必须有 Swagger 注解，必填/可选必须明确区分。

### 7.1 Swagger 注解规则

| 场景 | 注解 | 必填属性 |
|------|------|---------|
| 必填字段 | `@ApiProperty()` | `description`，建议加 `example` |
| 可选字段 | `@ApiPropertyOptional()` | `description`，建议加 `example` |
| 字符串 | 两者皆可 | `type: 'string'` |
| 整数 | 两者皆可 | `type: 'integer'` |
| 布尔 | 两者皆可 | `type: 'boolean'` |
| 数组 | 两者皆可 | `type: [String]` / `[Number]` |
| 枚举 | 两者皆可 | `enum: SomeEnum`, `example: SomeEnum.VALUE` |
| 日期时间 | 两者皆可 | `type: 'string'`, `format: 'date-time'` |
| 嵌套对象 | 两者皆可 | `type: XxxResponseDto` |
| 嵌套数组 | 两者皆可 | `type: [XxxResponseDto]` |
| 默认值 | 附加 | `default: 0` |

**原则**：`@ApiPropertyOptional()` 只能用于 `@IsOptional()` 的字段，必填字段一律用 `@ApiProperty()`。

### 7.2 请求 DTO（Create / Update / Query）

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

  @ApiPropertyOptional({ description: '排序', type: 'integer', default: 0, example: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiProperty({ description: '是否启用', type: 'boolean', example: true })
  @IsBoolean()
  enabled: boolean;
}

// Update 继承 Create，排除不可修改的字段
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}

// Query 继承 PaginationSortDto，所有条件可选
export class QueryUserDto extends PaginationSortDto {
  @ApiPropertyOptional({ description: '关键词', type: 'string' })
  @IsOptional()
  keyword?: string;
}
```

### 7.3 响应 DTO（Response）

响应 DTO 必须满足：

1. **每个字段必须有 `@ApiProperty()` 或 `@ApiPropertyOptional()`** — 前端 TS 类型从 Swagger 生成
2. **暴露字段用 `@Expose()`，隐藏字段用 `@Exclude()`** — 配合 `plainToInstance()` 精确控制输出
3. **数据库自增 `id` 必须 `@Exclude()`** — 对外暴露业务主键（如 `userId` UUID），不暴露数据库 `id`
4. **敏感字段（password）必须排除** — 在响应 DTO 中不出现
5. **嵌套对象用 `@Type(() => XxxResponseDto)`** — 让 `plainToInstance` 正确转换类型
6. **字段转换用 `@Transform()`** — 如 Prisma 关联结构转平铺结构、null 转空字符串

```typescript
export class UserResponseDto {
  // 隐藏数据库自增 id
  @ApiProperty({ description: '数据库ID', type: 'integer' })
  @Exclude()
  id: number;

  // 暴露业务 UUID
  @ApiProperty({ description: '用户ID', example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e', type: 'string' })
  @Expose()
  userId: string;

  @ApiPropertyOptional({ description: '邮箱', type: 'string' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  email?: string;

  @ApiProperty({ description: '状态', enum: UserStatus, example: UserStatus.ENABLED })
  @Expose()
  status: UserStatus;

  @ApiProperty({ description: '创建时间', type: 'string', format: 'date-time' })
  @Expose()
  createdAt: Date;

  // 嵌套对象 — @Type + @Transform 转换 Prisma 关联结构
  @ApiPropertyOptional({ description: '角色列表', type: [RoleResponseDto] })
  @Expose()
  @Type(() => RoleResponseDto)
  @Transform(({ obj }) => obj.userRoles?.map((ur: any) => ur.role) || [])
  roles?: RoleResponseDto[];
}
```

### 7.4 禁止事项

- ❌ **禁止裸字段**：任何 DTO 字段不能没有 Swagger 注解
- ❌ **禁止必填字段用 `@ApiPropertyOptional()``**
- ❌ **禁止数组/枚举/数字/布尔/日期不标 `type`**
- ❌ **禁止响应 DTO 中出现 `password`** — 用 `@Exclude()` 或不在 DTO 中定义
- ❌ **禁止响应 DTO 暴露数据库自增 `id`** — 用 `@Exclude()`，对外暴露 UUID
