import { Injectable, Logger } from '@nestjs/common';
import { RedisService, RedisUnavailableError } from '@/redis/redis.service';
import { CacheService } from '@/redis/cache.service';
import { CacheableExplorer } from '@/redis/cacheable.explorer';
import { CacheStatsDto } from './dto/cache-stats.dto';
import {
  CacheKeyInfoDto,
  CacheKeyValueDto,
  CacheClearResultDto,
} from './dto/cache-key-info.dto';

@Injectable()
export class CacheMonitorService {
  private readonly logger = new Logger(CacheMonitorService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStatsDto> {
    const stats = CacheableExplorer.getStats();
    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? parseFloat((stats.hits / total).toFixed(4)) : 0;

    let totalKeys = 0;
    let usedMemory = 0;
    let redisAvailable = false;

    try {
      redisAvailable = this.redisService.isAvailable();
      if (redisAvailable) {
        // DBSIZE
        const dbsize = await this.safeRedisCall(() =>
          this.redisService.dbSize(),
        );
        totalKeys = dbsize ?? 0;

        // INFO memory
        const info = await this.safeRedisCall(() =>
          this.redisService.info('memory'),
        );
        if (info) {
          const match = info.match(/used_memory:(\d+)/);
          if (match) {
            usedMemory = parseInt(match[1], 10);
          }
        }
      }
    } catch {
      // 静默降级
    }

    return {
      hits: stats.hits,
      misses: stats.misses,
      evictions: stats.evictions,
      hitRate,
      totalKeys,
      usedMemory,
      redisAvailable,
    };
  }

  /**
   * 按 pattern 扫描缓存 key 列表（支持分页）
   * 先 SCAN 收集所有 key 名字，内存分页后仅获取当前页的 TYPE/TTL/SIZE
   */
  async getKeys(
    pattern: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: CacheKeyInfoDto[]; total: number; page: number; pageSize: number }> {
    const allKeys = new Set<string>();
    const maxScan = 5000; // 安全阀：避免 pattern=* 时扫描过多 key

    try {
      for await (const keys of this.redisService.scanIterator(pattern, 100)) {
        for (const key of keys) {
          allKeys.add(key);
        }
        if (allKeys.size >= maxScan) {
          this.logger.warn(
            `Pattern "${pattern}" matched >=${maxScan} keys, truncating scan for pagination`,
          );
          break;
        }
      }
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, cannot scan keys');
        return { items: [], total: 0, page, pageSize };
      }
      throw e;
    }

    const total = allKeys.size;
    const skip = (page - 1) * pageSize;
    const pageKeys = Array.from(allKeys).slice(skip, skip + pageSize);

    const items = await Promise.all(
      pageKeys.map(async (key) => {
        const [keyType, ttl] = await Promise.all([
          this.safeRedisCall(() => this.redisService.type(key)),
          this.safeRedisCall(() => this.redisService.ttl(key)),
        ]);

        const info: CacheKeyInfoDto = {
          key,
          type: keyType ?? 'unknown',
          ttl: ttl ?? -2,
        };

        // 仅 String 类型能计算 value 大小
        if (keyType === 'string') {
          const value = await this.safeRedisCall(() =>
            this.redisService.get(key),
          );
          if (value) {
            info.size = Buffer.byteLength(value, 'utf8');
          }
        }

        return info;
      }),
    );

    return { items, total, page, pageSize };
  }

  /**
   * 读取单个 key 的值和 TTL
   * 根据 key 的类型自动选择读取命令
   */
  async getKeyValue(key: string): Promise<CacheKeyValueDto | null> {
    try {
      const [ttl, keyType] = await Promise.all([
        this.safeRedisCall(() => this.redisService.ttl(key)),
        this.safeRedisCall(() => this.redisService.type(key)),
      ]);

      if (keyType === null) {
        return null;
      }

      let raw: string | Record<string, string> | null = null;

      switch (keyType) {
        case 'string': {
          raw = await this.safeRedisCall(() => this.redisService.get(key));
          break;
        }
        case 'hash': {
          const hash = await this.safeRedisCall(() => this.redisService.hGetAll(key));
          if (hash) {
            // 尝试把 hash 值 JSON 反序列化
            const parsed: Record<string, unknown> = {};
            for (const [field, val] of Object.entries(hash)) {
              try {
                parsed[field] = JSON.parse(val);
              } catch {
                parsed[field] = val;
              }
            }
            return {
              key,
              ttl: ttl ?? -2,
              value: parsed,
            };
          }
          break;
        }
        default: {
          return {
            key,
            ttl: ttl ?? -2,
            value: `[${keyType} 类型暂不支持展示]`,
          };
        }
      }

      if (raw === null || raw === undefined) {
        return null;
      }

      let value: unknown = raw;
      if (typeof raw === 'string') {
        try {
          value = JSON.parse(raw);
        } catch {
          // 非 JSON，保持原始字符串
        }
      }

      return {
        key,
        ttl: ttl ?? -2,
        value,
      };
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        return null;
      }
      throw e;
    }
  }

  /**
   * 按 pattern 清理缓存
   */
  async clearCache(pattern: string): Promise<CacheClearResultDto> {
    let deleted = 0;

    try {
      for await (const keys of this.redisService.scanIterator(pattern, 100)) {
        if (keys.length > 0) {
          await this.redisService.del(...keys);
          deleted += keys.length;
        }
      }
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, cannot clear cache');
      } else {
        throw e;
      }
    }

    return { deleted };
  }

  /**
   * Redis 健康检查
   */
  async getHealth(): Promise<{ available: boolean; ping: boolean }> {
    const available = this.redisService.isAvailable();
    let ping = false;
    if (available) {
      try {
        ping = await this.redisService.ping();
      } catch {
        ping = false;
      }
    }
    return { available, ping };
  }

  /** 重置缓存统计 */
  resetStats(): void {
    CacheableExplorer.resetStats();
  }

  /** 安全执行 Redis 操作，Redis 不可用时返回 null */
  private async safeRedisCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        return null;
      }
      throw e;
    }
  }
}
