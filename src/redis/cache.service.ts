import { Injectable } from '@nestjs/common';
import { RedisService, RedisUnavailableError } from './redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  /** 获取缓存值，自动 JSON 解析 */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      if (e instanceof RedisUnavailableError) return null;
      if (e instanceof SyntaxError) {
        // 不是 JSON，直接返回原始字符串（兼容场景）
        return (await this.redis.get(key)) as unknown as T;
      }
      throw e;
    }
  }

  /** 设置缓存值，自动 JSON 序列化 */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, { ttlSeconds });
    } catch (e) {
      if (e instanceof RedisUnavailableError) return; // 静默降级
      throw e;
    }
  }

  /** 删除指定 key */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (e) {
      if (e instanceof RedisUnavailableError) return;
      throw e;
    }
  }

  /** 按 pattern 批量删除（如 `gvr:auth:session:user-123:*`） */
  async delPattern(pattern: string): Promise<void> {
    try {
      for await (const keys of this.redis.scanIterator(pattern)) {
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (e) {
      if (e instanceof RedisUnavailableError) return;
      throw e;
    }
  }

  /** 检查 key 是否存在 */
  async has(key: string): Promise<boolean> {
    try {
      const count = await this.redis.exists(key);
      return count > 0;
    } catch (e) {
      if (e instanceof RedisUnavailableError) return false;
      throw e;
    }
  }
}
