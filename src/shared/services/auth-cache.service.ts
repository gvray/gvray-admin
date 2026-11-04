import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/redis/redis.service';
import { PermissionCacheService } from '@/redis/permission-cache.service';

/**
 * 用户上下文缓存：菜单树 / 当前用户信息。
 * 在角色、权限、用户档案、岗位、部门变更时通过 invalidateUser 失效。
 */
@Injectable()
export class AuthCacheService {
  private readonly logger = new Logger(AuthCacheService.name);
  private readonly ttlSeconds: number;
  private readonly menuPrefix = 'auth:menus';
  private readonly profilePrefix = 'auth:profile';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly permissionCache: PermissionCacheService,
  ) {
    this.ttlSeconds = this.configService.get<number>('app.authCtxCacheTtl', 600);
  }

  async getMenus<T>(userId: string): Promise<T | null> {
    return this.get<T>(`${this.menuPrefix}:${userId}`);
  }

  async setMenus(userId: string, menus: unknown): Promise<void> {
    await this.set(`${this.menuPrefix}:${userId}`, menus);
  }

  async getProfile<T>(userId: string): Promise<T | null> {
    return this.get<T>(`${this.profilePrefix}:${userId}`);
  }

  async setProfile(userId: string, profile: unknown): Promise<void> {
    await this.set(`${this.profilePrefix}:${userId}`, profile);
  }

  async invalidateUser(userId: string): Promise<void> {
    if (!this.redisService.isAvailable()) return;
    try {
      await this.redisService.del(
        `${this.menuPrefix}:${userId}`,
        `${this.profilePrefix}:${userId}`,
      );
    } catch (error) {
      this.logger.warn(`失效用户上下文缓存失败: ${userId}`, error);
    }
  }

  /**
   * 一次性失效用户全部缓存：上下文（菜单/资料）+ 权限码。
   * 角色分配/移除、用户改状态等场景调用，避免漏删其中一份。
   */
  async invalidateUserAll(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUser(userId),
      this.permissionCache.del(userId),
    ]);
  }

  private async get<T>(key: string): Promise<T | null> {
    if (!this.redisService.isAvailable()) return null;
    try {
      const raw = await this.redisService.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async set(key: string, value: unknown): Promise<void> {
    if (!this.redisService.isAvailable()) return;
    try {
      await this.redisService.set(key, JSON.stringify(value), {
        ttlSeconds: this.ttlSeconds,
      });
    } catch {
      // 缓存写入失败不影响业务
    }
  }
}
