import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/redis/cache.service';
import { RedisService, RedisUnavailableError } from '@/redis/redis.service';
import { RedisKeys } from '@/redis/constants/redis-key.constant';

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface ParsedSessionInfo {
  tokenHash: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface OnlineUser {
  userId: string;
  username: string;
  nickname: string;
  sessionCount: number;
  lastActiveAt: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // ===== Refresh Token =====

  async storeRefreshToken(
    userId: string,
    token: string,
    metadata: SessionMetadata,
    expiresInSeconds: number,
    accessTokenJti?: string,
    accessTokenExpiresIn?: number,
  ): Promise<void> {
    const tokenHash = this.hashToken(token);
    const key = RedisKeys.auth.refreshToken(userId, tokenHash);

    // 解析 UA 和 IP
    const parsed = this.parseUserAgent(metadata.userAgent);
    const location = await this.getLocationFromIP(metadata.ipAddress);
    const now = new Date().toISOString();

    try {
      await this.redisService.hSet(key, 'userAgent', metadata.userAgent || '');
      await this.redisService.hSet(key, 'ipAddress', metadata.ipAddress || '');
      await this.redisService.hSet(key, 'browser', parsed.browser || '');
      await this.redisService.hSet(key, 'os', parsed.os || '');
      await this.redisService.hSet(key, 'device', parsed.device || '');
      await this.redisService.hSet(key, 'location', location || '');
      await this.redisService.hSet(key, 'createdAt', now);
      await this.redisService.hSet(key, 'lastActiveAt', now);
      if (accessTokenJti) {
        await this.redisService.hSet(key, 'accessTokenJti', accessTokenJti);
      }
      if (accessTokenExpiresIn) {
        await this.redisService.hSet(
          key,
          'accessTokenExpiresIn',
          String(accessTokenExpiresIn),
        );
      }
      await this.redisService.expire(key, expiresInSeconds);

      // 建立 AT jti → RT hash 反向索引（logout 时定位 RT）
      if (accessTokenJti) {
        await this.redisService.set(
          RedisKeys.auth.atJtiMap(accessTokenJti),
          `${userId}:${tokenHash}`,
          { ttlSeconds: expiresInSeconds },
        );
      }

      // 加入用户会话集合，同步设置 TTL（与 RT 一致）
      await this.redisService.sAdd(
        RedisKeys.auth.sessionsSet(userId),
        tokenHash,
      );
      await this.redisService.expire(
        RedisKeys.auth.sessionsSet(userId),
        expiresInSeconds,
      );
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, skipping RT cache');
        return;
      }
      throw e;
    }
  }

  /**
   * 心跳更新：每次请求时更新 session 的最后活跃时间
   * 只更新已存在的 session，不重建已删除的 key
   */
  async touchSession(userId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const key = RedisKeys.auth.refreshToken(userId, tokenHash);
    const sessionSetKey = RedisKeys.auth.sessionsSet(userId);

    try {
      // 先检查 key 是否还存在（被踢/登出/手动清理后不应重建）
      const exists = await this.redisService.exists(key);
      if (exists === 0) {
        return;
      }

      await this.redisService.hSet(
        key,
        'lastActiveAt',
        new Date().toISOString(),
      );
      // 续期 RT Hash TTL（7 天），兼容历史数据中 TTL 为 -1 的残留 key
      const currentTtl = await this.redisService.ttl(key);
      if (currentTtl === -1) {
        await this.redisService.expire(key, 7 * 24 * 60 * 60);
      }
      // 同步续期 sessionsSet TTL
      const setTtl = await this.redisService.ttl(sessionSetKey);
      if (setTtl === -1) {
        await this.redisService.expire(sessionSetKey, 7 * 24 * 60 * 60);
      }
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        // 静默忽略，不影响请求
        return;
      }
      throw e;
    }
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ userId: string; metadata: SessionMetadata } | null> {
    const tokenHash = this.hashToken(token);

    // Step 1: 从 DB 获取基础记录（RT 是纯随机字符串，必须查 DB 获取 userId）
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token },
      select: {
        userId: true,
        isRevoked: true,
        expiresAt: true,
        userAgent: true,
        ipAddress: true,
      },
    });

    if (!tokenRecord) {
      return null;
    }

    const key = RedisKeys.auth.refreshToken(tokenRecord.userId, tokenHash);

    // Step 2: 大厂主路径 — 查 Redis Session（快路径，99% 请求走这里）
    try {
      const hash = await this.redisService.hGetAll(key);

      if (Object.keys(hash).length > 0) {
        // Redis 命中 → session 活跃，直接通过
        return {
          userId: tokenRecord.userId,
          metadata: {
            userAgent: hash.userAgent || undefined,
            ipAddress: hash.ipAddress || undefined,
          },
        };
      }

      // Redis 存在但 key 不存在 → session 已过期/被清理，直接拒绝
      // （不需要 fallback 到 DB，Redis 是 session 的真实来源）
      this.logger.debug(`[RT Verify] Redis session 不存在: ${key}`);
      return null;
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        // Step 3: 兜底路径 — Redis 不可用时 fallback 到 DB
        this.logger.warn(
          '[RT Verify] Redis unavailable, fallback to DB validation',
        );

        if (tokenRecord.isRevoked) {
          return null;
        }
        if (new Date() > tokenRecord.expiresAt) {
          return null;
        }

        return {
          userId: tokenRecord.userId,
          metadata: {
            userAgent: tokenRecord.userAgent || undefined,
            ipAddress: tokenRecord.ipAddress || undefined,
          },
        };
      }
      throw e;
    }
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.revokeRefreshTokenByHash(userId, tokenHash);

    // 同时更新数据库
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeRefreshTokenByHash(
    userId: string,
    tokenHash: string,
  ): Promise<void> {
    try {
      const key = RedisKeys.auth.refreshToken(userId, tokenHash);

      // 先读取 AT jti，用于加入黑名单
      const jti = await this.redisService.hGet(key, 'accessTokenJti');
      const ttlRaw = await this.redisService.hGet(
        key,
        'accessTokenExpiresIn',
      );

      if (jti) {
        const ttl = ttlRaw ? parseInt(ttlRaw, 10) : 15 * 60;
        await this.blacklistAccessToken(jti, ttl);
        // 删除反向索引
        await this.redisService.del(RedisKeys.auth.atJtiMap(jti));
      }

      await this.redisService.del(key);
      await this.redisService.sRem(
        RedisKeys.auth.sessionsSet(userId),
        tokenHash,
      );
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, skipping RT revocation cache');
      }
    }
  }

  /**
   * 通过 Access Token JTI 撤销对应会话（logout 时用）
   */
  async revokeByAccessTokenJti(accessTokenJti: string): Promise<void> {
    try {
      const mapKey = RedisKeys.auth.atJtiMap(accessTokenJti);
      const mapping = await this.redisService.get(mapKey);
      if (!mapping) return;

      const [userId, tokenHash] = mapping.split(':');
      if (userId && tokenHash) {
        await this.revokeRefreshTokenByHash(userId, tokenHash);
      }
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, skipping revoke by AT jti');
      }
    }
  }

  async revokeAllUserTokens(
    userId: string,
    exceptTokenHash?: string,
  ): Promise<void> {
    try {
      const sessionKey = RedisKeys.auth.sessionsSet(userId);
      const tokenHashes = await this.redisService.sMembers(sessionKey);

      for (const hash of tokenHashes) {
        if (exceptTokenHash && hash === exceptTokenHash) continue;
        await this.redisService.del(RedisKeys.auth.refreshToken(userId, hash));
      }

      if (exceptTokenHash) {
        // 只保留 exceptTokenHash
        await this.redisService.del(sessionKey);
        await this.redisService.sAdd(sessionKey, exceptTokenHash);
      } else {
        await this.redisService.del(sessionKey);
      }
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, skipping bulk revocation cache');
      }
    }

    // 同时更新数据库
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  // ===== Access Token 黑名单 =====

  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redisService.set(RedisKeys.auth.blacklist(jti), '1', {
        ttlSeconds,
      });
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, skipping blacklist');
      }
    }
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      const exists = await this.redisService.exists(
        RedisKeys.auth.blacklist(jti),
      );
      return exists > 0;
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        return false; // 降级：不拦截
      }
      throw e;
    }
  }

  // ===== 踢下线 =====

  async kickoutUser(userId: string): Promise<void> {
    const kickoutAt = Date.now();
    try {
      await this.redisService.set(
        RedisKeys.auth.kickout(userId),
        String(kickoutAt),
        { ttlSeconds: 7 * 24 * 60 * 60 }, // 7 天
      );
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, skipping kickout marker');
      }
    }
  }

  async isUserKickedOut(
    userId: string,
    tokenIssuedAt: number,
  ): Promise<boolean> {
    try {
      const raw = await this.redisService.get(RedisKeys.auth.kickout(userId));
      if (!raw) return false;
      const kickoutAt = parseInt(raw, 10);
      return tokenIssuedAt < kickoutAt;
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        return false; // 降级：不拦截
      }
      throw e;
    }
  }

  async clearKickout(userId: string): Promise<void> {
    try {
      await this.redisService.del(RedisKeys.auth.kickout(userId));
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        this.logger.warn('Redis unavailable, skipping clear kickout');
      }
    }
  }

  // ===== 会话管理（在线用户）=====

  async getUserSessions(userId: string): Promise<ParsedSessionInfo[]> {
    try {
      const sessionSetKey = RedisKeys.auth.sessionsSet(userId);
      const tokenHashes = await this.redisService.sMembers(sessionSetKey);

      const sessions: ParsedSessionInfo[] = [];
      for (const hash of tokenHashes) {
        const hashData = await this.redisService.hGetAll(
          RedisKeys.auth.refreshToken(userId, hash),
        );
        if (Object.keys(hashData).length > 0) {
          sessions.push({
            tokenHash: hash,
            ipAddress: hashData.ipAddress || undefined,
            browser: hashData.browser || undefined,
            os: hashData.os || undefined,
            device: hashData.device || undefined,
            location: hashData.location || undefined,
            createdAt: hashData.createdAt || new Date().toISOString(),
            lastActiveAt: hashData.lastActiveAt || hashData.createdAt || new Date().toISOString(),
          });
        } else {
          // 防御性清理：hash 已不存在但 sessionsSet 里还有引用，自动移除
          await this.redisService.sRem(sessionSetKey, hash);
          this.logger.debug(`[Session Cleanup] 移除失效引用: ${sessionSetKey} → ${hash}`);
        }
      }
      return sessions;
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        return []; // 降级：返回空列表
      }
      throw e;
    }
  }

  async getAllOnlineUserIds(): Promise<string[]> {
    try {
      const userIds = new Set<string>();
      for await (const keys of this.redisService.scanIterator('auth:sessions:*')) {
        for (const key of keys) {
          const parts = key.split(':');
          if (parts.length >= 3) {
            userIds.add(parts[2]);
          }
        }
      }
      return Array.from(userIds);
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        return [];
      }
      throw e;
    }
  }

  // ===== 心跳更新 =====

  async heartbeat(userId: string, tokenHash: string): Promise<void> {
    try {
      const key = RedisKeys.auth.refreshToken(userId, tokenHash);
      const sessionSetKey = RedisKeys.auth.sessionsSet(userId);

      // 先检查 key 是否还存在（被踢/登出/手动清理后不应重建）
      const exists = await this.redisService.exists(key);
      if (exists === 0) {
        return;
      }

      await this.redisService.hSet(key, 'lastActiveAt', new Date().toISOString());
      // 续期 RT Hash TTL（7 天），兼容历史数据中 TTL 为 -1 的残留 key
      const currentTtl = await this.redisService.ttl(key);
      if (currentTtl === -1) {
        await this.redisService.expire(key, 7 * 24 * 60 * 60);
      }
      // 同步续期 sessionsSet TTL
      const setTtl = await this.redisService.ttl(sessionSetKey);
      if (setTtl === -1) {
        await this.redisService.expire(sessionSetKey, 7 * 24 * 60 * 60);
      }
    } catch (e) {
      if (e instanceof RedisUnavailableError) {
        // 静默降级
        return;
      }
      throw e;
    }
  }

  // ===== 工具方法 =====

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
  }

  private parseUserAgent(userAgent?: string): {
    browser?: string;
    os?: string;
    device?: string;
  } {
    if (!userAgent) return {};
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      const browser = result.browser.name
        ? `${result.browser.name} ${result.browser.version || ''}`.trim()
        : undefined;
      const os = result.os.name
        ? `${result.os.name} ${result.os.version || ''}`.trim()
        : undefined;
      const device = result.device.model || result.device.type || 'Desktop';
      return { browser, os, device };
    } catch {
      return {};
    }
  }

  private async getLocationFromIP(
    ipAddress?: string,
  ): Promise<string | undefined> {
    if (!ipAddress) return undefined;
    // 跳过本地 IP
    if (
      ipAddress === '127.0.0.1' ||
      ipAddress === '::1' ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')
    ) {
      return '本地网络';
    }
    try {
      const response = await fetch(
        `http://ip-api.com/json/${ipAddress}?lang=zh-CN`,
      );
      if (!response.ok) return undefined;
      const data = (await response.json()) as {
        status: string;
        country?: string;
        regionName?: string;
        city?: string;
      };
      if (data.status === 'success') {
        const parts: string[] = [];
        if (data.country) parts.push(data.country);
        if (data.regionName && data.regionName !== data.country) {
          parts.push(data.regionName);
        }
        if (data.city && data.city !== data.regionName) {
          parts.push(data.city);
        }
        return parts.length > 0 ? parts.join('-') : undefined;
      }
    } catch {
      // 忽略查询失败
    }
    return undefined;
  }
}
