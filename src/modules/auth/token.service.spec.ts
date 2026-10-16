import * as crypto from 'crypto';
import { TokenService } from './token.service';
import { RedisUnavailableError } from '@/redis/redis.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { CacheService } from '@/redis/cache.service';

// 复刻 TokenService.hashToken 的算法，用于在测试里算出期望的 tokenHash
const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);

const TOKEN = 'test-refresh-token';
const TOKEN_HASH = hashToken(TOKEN);
const USER_ID = 'user-1';

describe('TokenService - verifyRefreshToken', () => {
  let service: TokenService;
  let redisService: { get: jest.Mock; hGetAll: jest.Mock; hSet: jest.Mock; expire: jest.Mock; set: jest.Mock; sAdd: jest.Mock };
  let prismaService: { refreshToken: { findFirst: jest.Mock; create: jest.Mock; updateMany: jest.Mock } };

  beforeEach(() => {
    redisService = {
      get: jest.fn(),
      hGetAll: jest.fn(),
      hSet: jest.fn(),
      expire: jest.fn(),
      set: jest.fn(),
      sAdd: jest.fn(),
    };
    prismaService = {
      refreshToken: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    service = new TokenService(
      {} as CacheService,
      redisService as unknown as RedisService,
      prismaService as unknown as PrismaService,
    );
  });

  it('Redis 命中时走快路径，不查 MySQL', async () => {
    redisService.get.mockResolvedValue(USER_ID);
    redisService.hGetAll.mockResolvedValue({ userAgent: 'ua', ipAddress: '1.2.3.4' });

    const result = await service.verifyRefreshToken(TOKEN);

    expect(result).toEqual({
      userId: USER_ID,
      metadata: { userAgent: 'ua', ipAddress: '1.2.3.4' },
    });
    expect(prismaService.refreshToken.findFirst).not.toHaveBeenCalled();
  });

  it('Redis 不可用时回源 MySQL，命中后回填 Redis', async () => {
    // Redis 不可用 → get 抛错
    redisService.get.mockRejectedValue(new RedisUnavailableError('down'));
    // MySQL 命中一条有效记录
    prismaService.refreshToken.findFirst.mockResolvedValue({
      userId: USER_ID,
      ipAddress: '1.2.3.4',
      userAgent: 'ua',
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });

    const result = await service.verifyRefreshToken(TOKEN);

    // 1. 返回 MySQL 的记录
    expect(result).toEqual({
      userId: USER_ID,
      metadata: { userAgent: 'ua', ipAddress: '1.2.3.4' },
    });
    // 2. 确实回源了 MySQL
    expect(prismaService.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: TOKEN_HASH,
        isRevoked: false,
        expiresAt: { gt: expect.any(Date) },
      },
      select: { userId: true, ipAddress: true, userAgent: true, expiresAt: true },
    });
    // 3. 回填了 Redis（至少写了 hash key + 索引）
    expect(redisService.hSet).toHaveBeenCalled();
    expect(redisService.set).toHaveBeenCalled();
  });

  it('Redis 不可用且 MySQL 也无记录时返回 null', async () => {
    redisService.get.mockRejectedValue(new RedisUnavailableError('down'));
    prismaService.refreshToken.findFirst.mockResolvedValue(null);

    const result = await service.verifyRefreshToken(TOKEN);

    expect(result).toBeNull();
  });

  it('Redis miss（key 不存在）且 MySQL 无记录时返回 null', async () => {
    // Redis 正常但没查到（get 返回 null）
    redisService.get.mockResolvedValue(null);
    prismaService.refreshToken.findFirst.mockResolvedValue(null);

    const result = await service.verifyRefreshToken(TOKEN);

    expect(result).toBeNull();
  });

  it('已撤销的 token 在 MySQL 也查不到，返回 null', async () => {
    redisService.get.mockRejectedValue(new RedisUnavailableError('down'));
    // MySQL 因为 isRevoked=false 过滤，撤销的查不到
    prismaService.refreshToken.findFirst.mockResolvedValue(null);

    const result = await service.verifyRefreshToken(TOKEN);

    expect(result).toBeNull();
  });
});
