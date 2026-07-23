import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_METADATA = 'cacheable:options';

export interface CacheableOptions {
  /** 缓存 key 模板，支持位置参数 {0} {1} */
  key: string;
  /** 缓存 TTL（秒），默认 300（5 分钟） */
  ttl?: number;
  /** 空值缓存 TTL（秒），默认 30 */
  nullTtl?: number;
  /** 是否启用 TTL 随机抖动（±10%）防雪崩，默认 true */
  jitter?: boolean;
}

/**
 * 声明式缓存装饰器
 * 作用在 Service 方法上，自动缓存方法返回值到 Redis
 *
 * @example
 * @Cacheable({ key: 'sys:dict:items:{0}', ttl: 1800 })
 * async getDictionaryItemsByTypeCode(typeCode: string) { ... }
 */
export function Cacheable(options: CacheableOptions): MethodDecorator {
  return SetMetadata(CACHEABLE_METADATA, options);
}
