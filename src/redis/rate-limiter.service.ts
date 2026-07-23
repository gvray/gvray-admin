import { Injectable } from '@nestjs/common';
import { RedisService, RedisUnavailableError } from './redis.service';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remainingAttempts: number;
  resetAt: number; // 重置时间戳（毫秒）
}

@Injectable()
export class RateLimiterService {
  constructor(private readonly redis: RedisService) {}

  /**
   * 检查是否允许执行（固定窗口计数器）
   * @param key 限流 key（如 `login:fail:account`）
   * @param maxAttempts 最大尝试次数
   * @param windowSeconds 窗口时间（秒）
   * @returns 限流结果
   */
  async check(
    key: string,
    maxAttempts: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    try {
      const count = await this.redis.incr(key);

      // 第一次计数，设置过期时间
      if (count === 1) {
        await this.redis.expire(key, windowSeconds);
      }

      const ttl = await this.redis.ttl(key);
      const resetAt = Date.now() + Math.max(ttl, 0) * 1000;

      return {
        allowed: count <= maxAttempts,
        currentCount: count,
        remainingAttempts: Math.max(0, maxAttempts - count),
        resetAt,
      };
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        // Redis 不可用时，允许通过（降级到无限制）
        return {
          allowed: true,
          currentCount: 0,
          remainingAttempts: maxAttempts,
          resetAt: Date.now() + windowSeconds * 1000,
        };
      }
      throw e;
    }
  }

  /**
   * 重置限流计数器
   */
  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (e) {
      if (e instanceof RedisUnavailableError) return;
      throw e;
    }
  }

  /**
   * 获取当前计数（不增加）
   */
  async getCount(key: string): Promise<number> {
    try {
      const raw = await this.redis.get(key);
      return raw === null ? 0 : parseInt(raw, 10);
    } catch (e) {
      if (e instanceof RedisUnavailableError) return 0;
      throw e;
    }
  }
}
