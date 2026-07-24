import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);
  private readonly KEY_PREFIX = 'perm:user';
  private readonly DEFAULT_TTL = 3600; // 1 小时

  constructor(private readonly redisService: RedisService) {}

  /**
   * 设置用户权限缓存
   */
  async set(
    userId: string,
    codes: string[],
    ttlSeconds = this.DEFAULT_TTL,
  ): Promise<void> {
    if (!this.redisService.isAvailable()) {
      return;
    }
    try {
      await this.redisService.set(this.key(userId), JSON.stringify(codes), {
        ttlSeconds,
      });
    } catch {
      // 缓存写入失败不影响业务
    }
  }

  /**
   * 获取用户权限缓存
   * @returns 权限码数组，未命中返回 null
   */
  async get(userId: string): Promise<string[] | null> {
    if (!this.redisService.isAvailable()) {
      return null;
    }
    try {
      const raw = await this.redisService.get(this.key(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * 删除用户权限缓存（踢人、改角色时调用）
   */
  async del(userId: string): Promise<void> {
    if (!this.redisService.isAvailable()) {
      return;
    }
    try {
      await this.redisService.del(this.key(userId));
    } catch {
      // 缓存删除失败不影响业务
    }
  }

  private key(userId: string): string {
    return `${this.KEY_PREFIX}:${userId}`;
  }
}
