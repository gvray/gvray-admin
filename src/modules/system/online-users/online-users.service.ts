import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenService } from '@/modules/auth/token.service';
import { AuthCacheService } from '@/shared/services/auth-cache.service';
import { OnlineUserItemDto } from './dto/online-user-item.dto';
import { SessionDetailDto } from './dto/session-detail.dto';

@Injectable()
export class OnlineUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly authCache: AuthCacheService,
  ) {}

  async getOnlineUsers(page: number, pageSize: number, keyword?: string) {
    const allUserIds = await this.tokenService.getAllOnlineUserIds();

    if (allUserIds.length === 0) {
      return { items: [], total: 0 };
    }

    const users = await this.prisma.user.findMany({
      where: {
        userId: { in: allUserIds },
        ...(keyword
          ? {
              OR: [
                { username: { contains: keyword } },
                { nickname: { contains: keyword } },
              ],
            }
          : {}),
      },
      select: {
        userId: true,
        username: true,
        nickname: true,
        avatar: true,
        status: true,
      },
    });

    const total = users.length;

    // 一次性拉全部在线用户的会话，避免逐个 getUserSessions 的 N+1 Redis 往返
    const allSessions = await Promise.all(
      users.map((u) => this.tokenService.getUserSessions(u.userId)),
    );

    const now = new Date().toISOString();
    const items: OnlineUserItemDto[] = users.map((user, idx) => {
      const sessions = allSessions[idx];
      const lastActiveAt =
        sessions.length > 0
          ? sessions.reduce(
              (latest, s) => (s.lastActiveAt > latest ? s.lastActiveAt : latest),
              sessions[0].lastActiveAt,
            )
          : now;
      const loginAt =
        sessions.length > 0
          ? sessions.reduce(
              (earliest, s) => (s.createdAt < earliest ? s.createdAt : earliest),
              sessions[0].createdAt,
            )
          : now;

      return {
        userId: user.userId,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar ?? undefined,
        status: user.status,
        sessionCount: sessions.length,
        loginAt,
        lastActiveAt,
      };
    });

    // 按最后活跃时间倒序后分页（活跃度排序优先于翻页）
    items.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return { items: pageItems, total };
  }

  async getUserSessions(userId: string): Promise<SessionDetailDto[]> {
    return this.tokenService.getUserSessions(userId);
  }

  async kickUser(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
    await this.authCache.invalidateUserAll(userId);
  }

  async kickUserSession(userId: string, tokenHash: string): Promise<void> {
    await this.tokenService.revokeRefreshTokenByHash(userId, tokenHash);
  }
}
