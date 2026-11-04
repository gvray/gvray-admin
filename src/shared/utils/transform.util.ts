import { ClassConstructor, plainToInstance } from 'class-transformer';

/**
 * plainToInstance 默认选项：过滤掉未标注 @Expose 的字段，
 * 避免把 Prisma 整对象（含 password/id 等敏感或自增字段）泄漏到响应。
 * 全项目统一通过此函数转换，保证 53 处调用行为一致。
 */
export const PLAIN_EXTRAS = { excludeExtraneousValues: true } as const;

/**
 * 将 Prisma 查询结果转换为 DTO，默认排除未暴露字段。
 */
export function toDto<D>(
  Dto: ClassConstructor<D>,
  plain: unknown,
): D {
  return plainToInstance(Dto, plain, PLAIN_EXTRAS);
}

/**
 * 批量转换。
 */
export function toDtoList<D>(
  Dto: ClassConstructor<D>,
  plain: unknown[],
): D[] {
  return plainToInstance(Dto, plain, PLAIN_EXTRAS) as D[];
}
