import { Injectable, Logger } from '@nestjs/common';
import { RedisService, RedisUnavailableError } from './redis.service';
import * as crypto from 'crypto';

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * 尝试获取分布式锁
   * @param lockKey 锁名称
   * @param ttlSeconds 锁过期时间（秒），防止死锁
   * @returns 锁 token（释放锁时需要），获取失败返回 null
   */
  async acquire(lockKey: string, ttlSeconds: number): Promise<string | null> {
    try {
      const token = crypto.randomUUID();
      // SET key value NX EX seconds — 只有 key 不存在时才设置
      const result = await this.redis.set(lockKey, token, {
        nx: true,
        ttlSeconds,
      });
      return result === 'OK' ? token : null;
    } catch (e) {
      if (e instanceof RedisUnavailableError) return null;
      this.logger.error(`Lock acquire failed: ${lockKey}`, e);
      return null;
    }
  }

  /**
   * 释放分布式锁（只有持有 token 的进程才能释放）
   * @param lockKey 锁名称
   * @param token acquire 返回的 token
   * @returns 是否成功释放
   */
  async release(lockKey: string, token: string): Promise<boolean> {
    try {
      // 用 Lua 脚本保证"判断 token + 删除"的原子性
      const lua = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.redis.eval(lua, {
        keys: [lockKey],
        arguments: [token],
      });
      return result === 1;
    } catch (e) {
      if (e instanceof RedisUnavailableError) return false;
      this.logger.error(`Lock release failed: ${lockKey}`, e);
      return false;
    }
  }

  /**
   * 自动获取锁、执行函数、释放锁（finally 保证释放）
   * @param lockKey 锁名称
   * @param ttlSeconds 锁过期时间（秒）
   * @param fn 要执行的函数
   * @param options.waitTimeoutMs 最大等待时间（毫秒），默认不等待
   * @returns fn 的返回值
   * @throws LockAcquireError 获取锁失败时抛出
   */
  async withLock<T>(
    lockKey: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
    options?: { waitTimeoutMs?: number; retryIntervalMs?: number },
  ): Promise<T> {
    const { waitTimeoutMs = 0, retryIntervalMs = 100 } = options ?? {};

    let token: string | null = null;
    const startTime = Date.now();

    while (true) {
      token = await this.acquire(lockKey, ttlSeconds);
      if (token !== null) break;

      if (waitTimeoutMs <= 0) {
        throw new LockAcquireError(`Failed to acquire lock: ${lockKey}`);
      }

      if (Date.now() - startTime >= waitTimeoutMs) {
        throw new LockAcquireError(
          `Timeout acquiring lock: ${lockKey} after ${waitTimeoutMs}ms`,
        );
      }

      await new Promise((r) => setTimeout(r, retryIntervalMs));
    }

    try {
      return await fn();
    } finally {
      await this.release(lockKey, token);
    }
  }
}

export class LockAcquireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockAcquireError';
  }
}
