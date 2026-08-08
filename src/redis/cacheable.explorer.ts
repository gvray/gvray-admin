import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Reflector, ModulesContainer } from '@nestjs/core';
import { CacheService } from './cache.service';
import { RedisUnavailableError } from './redis.service';
import {
  CACHEABLE_METADATA,
  CacheableOptions,
  CACHE_EVICT_METADATA,
  CacheEvictOptions,
} from './decorators';

/** 空值缓存标记 */
const NULL_MARKER = '__NULL__';

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}

/**
 * 声明式缓存探索器
 * 应用启动时扫描所有 Service 的原型方法，找到带 @Cacheable / @CacheEvict 的方法并用代理包装。
 * 这是 NestJS 中让装饰器在 Service 层生效的标准做法（类似 Spring AOP）。
 */
@Injectable()
export class CacheableExplorer implements OnApplicationBootstrap {
  private readonly logger = new Logger(CacheableExplorer.name);

  /** 全局缓存统计（内存存储，重启清零） */
  public static stats: CacheStats = { hits: 0, misses: 0, evictions: 0 };

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  /** 获取当前统计快照 */
  static getStats(): CacheStats {
    return { ...CacheableExplorer.stats };
  }

  /** 重置统计 */
  static resetStats(): void {
    CacheableExplorer.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  onApplicationBootstrap(): void {
    let wrappedCount = 0;

    for (const moduleRef of this.modulesContainer.values()) {
      for (const providerWrapper of moduleRef.providers.values()) {
        const instance = providerWrapper.instance;
        if (!instance || typeof instance !== 'object') {
          continue;
        }

        const prototype = Object.getPrototypeOf(instance);
        if (!prototype || prototype === Object.prototype) {
          continue;
        }

        const methodNames = Object.getOwnPropertyNames(prototype);
        for (const methodName of methodNames) {
          if (methodName === 'constructor') continue;
          const descriptor = Object.getOwnPropertyDescriptor(
            prototype,
            methodName,
          );
          if (!descriptor || typeof descriptor.value !== 'function') {
            continue;
          }

          const cacheableOptions = this.reflector.get<CacheableOptions>(
            CACHEABLE_METADATA,
            descriptor.value,
          );
          const cacheEvictOptions = this.reflector.get<CacheEvictOptions>(
            CACHE_EVICT_METADATA,
            descriptor.value,
          );

          if (cacheableOptions) {
            this.wrapCacheable(
              instance as Record<string, unknown>,
              methodName,
              cacheableOptions,
            );
            wrappedCount++;
          }
          if (cacheEvictOptions) {
            this.wrapCacheEvict(
              instance as Record<string, unknown>,
              methodName,
              cacheEvictOptions,
            );
            wrappedCount++;
          }
        }
      }
    }

    if (wrappedCount > 0) {
      this.logger.log(`声明式缓存代理完成: ${wrappedCount} 个方法`);
    }
  }

  /** 代理 @Cacheable 方法 */
  private wrapCacheable(
    instance: Record<string, unknown>,
    methodName: string,
    options: CacheableOptions,
  ): void {
    const original = instance[methodName] as (
      ...args: unknown[]
    ) => Promise<unknown>;
    const cacheService = this.cacheService;
    const logger = this.logger;

    instance[methodName] = async function (
      ...args: unknown[]
    ): Promise<unknown> {
      const key = buildKey(options.key, args);
      const ttl = computeTtl(options.ttl ?? 300, options.jitter ?? true);
      const nullTtl = options.nullTtl ?? 30;

      try {
        const cached = await cacheService.get<unknown>(key);
        if (cached !== null) {
          if (cached === NULL_MARKER) {
            CacheableExplorer.stats.hits++;
            logger.debug(`[Cache HIT-NULL] ${key}`);
            return [];
          }
          CacheableExplorer.stats.hits++;
          logger.debug(`[Cache HIT] ${key}`);
          return cached;
        }
      } catch (e) {
        if (e instanceof RedisUnavailableError) {
          logger.warn(
            `[Cache SKIP] Redis unavailable, executing origin method`,
          );
          return original.apply(this, args);
        }
        throw e;
      }

      CacheableExplorer.stats.misses++;
      logger.debug(`[Cache MISS] ${key}`);

      const result = await original.apply(this, args);

      try {
        if (isEmptyValue(result)) {
          await cacheService.set(key, NULL_MARKER, nullTtl);
          logger.debug(`[Cache SET-NULL] ${key} (TTL: ${nullTtl}s)`);
        } else {
          await cacheService.set(key, result, ttl);
          logger.debug(`[Cache SET] ${key} (TTL: ${ttl}s)`);
        }
      } catch (e) {
        if (e instanceof RedisUnavailableError) {
          logger.warn(`[Cache SET-FAIL] Redis unavailable, skip caching`);
        } else {
          throw e;
        }
      }

      return result;
    };
  }

  /** 代理 @CacheEvict 方法 */
  private wrapCacheEvict(
    instance: Record<string, unknown>,
    methodName: string,
    options: CacheEvictOptions,
  ): void {
    const original = instance[methodName] as (
      ...args: unknown[]
    ) => Promise<unknown>;
    const cacheService = this.cacheService;
    const logger = this.logger;

    instance[methodName] = async function (
      ...args: unknown[]
    ): Promise<unknown> {
      // beforeInvocation = true: 方法执行前清理
      if (options.beforeInvocation) {
        await doEvict(options, args, cacheService, logger);
      }

      const result = await original.apply(this, args);

      // beforeInvocation = false (默认): 方法执行后清理
      if (!options.beforeInvocation) {
        await doEvict(options, args, cacheService, logger);
      }

      return result;
    };
  }
}

/** 构建实际 key：将模板中的 {0} {1} 或 {0.typeCode} 替换为对应参数 */
function buildKey(template: string, args: unknown[]): string {
  return template.replace(/\{([^}]+)\}/g, (_, path) => {
    const value = getArgValue(args, path);
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/** 从 args 中按路径取值，支持 {0} 或 {0.typeCode} */
function getArgValue(args: unknown[], path: string): unknown {
  const parts = path.split('.');
  const idx = parseInt(parts[0], 10);
  if (isNaN(idx) || idx < 0 || idx >= args.length) {
    return undefined;
  }
  let value: unknown = args[idx];
  for (let i = 1; i < parts.length; i++) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[parts[i]];
    } else {
      return undefined;
    }
  }
  return value;
}

/** 计算带抖动的 TTL */
function computeTtl(baseTtl: number, jitter: boolean): number {
  if (!jitter || baseTtl <= 0) return baseTtl;
  const variance = baseTtl * 0.1; // ±10%
  return Math.floor(baseTtl + (Math.random() * variance * 2 - variance));
}

/** 判断是否为需要空值缓存的空值 */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/** 执行缓存清理 */
async function doEvict(
  options: CacheEvictOptions,
  args: unknown[],
  cacheService: CacheService,
  logger: Logger,
): Promise<void> {
  try {
    if (options.key) {
      const key = buildKey(options.key, args);
      await cacheService.del(key);
      CacheableExplorer.stats.evictions++;
      logger.debug(`[Cache EVICT] ${key}`);
    }
    if (options.pattern) {
      await cacheService.delPattern(options.pattern);
      CacheableExplorer.stats.evictions++;
      logger.debug(`[Cache EVICT-PATTERN] ${options.pattern}`);
    }
  } catch (e) {
    if (e instanceof RedisUnavailableError) {
      logger.warn(`[Cache EVICT-FAIL] Redis unavailable, skip eviction`);
    } else {
      throw e;
    }
  }
}
