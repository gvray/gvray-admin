import { SetMetadata } from '@nestjs/common';

export const CACHE_EVICT_METADATA = 'cache-evict:options';

export interface CacheEvictOptions {
  /** 精确 key（支持模板 {0} {1}） */
  key?: string;
  /** pattern 批量清理（如 sys:dict:*） */
  pattern?: string;
  /** 是否在方法执行前清理，默认 false（执行后清理） */
  beforeInvocation?: boolean;
}

/**
 * 声明式缓存清理装饰器
 * 作用在 Service 的写方法上，自动清理对应缓存
 *
 * @example
 * @CacheEvict({ pattern: 'sys:dict:*' })
 * async updateDictionaryType(...) { ... }
 */
export function CacheEvict(options: CacheEvictOptions): MethodDecorator {
  return SetMetadata(CACHE_EVICT_METADATA, options);
}
