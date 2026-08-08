import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenService } from '@/modules/auth/token.service';
import { PermissionCacheService } from '@/redis/permission-cache.service';
import { OnlineUserItemDto } from './dto/online-user-item.dto';
import { SessionDetailDto } from './dto/session-detail.dto';

@Injectable()
export class OnlineUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly permissionCache: PermissionCacheService,
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

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageUsers = users.slice(start, end);

    if (pageUsers.length === 0) {
      return { items: [], total };
    }

    const items: OnlineUserItemDto[] = await Promise.all(
      pageUsers.map(async (user) => {
        const sessions = await this.tokenService.getUserSessions(user.userId);
        const now = new Date().toISOString();

        const lastActiveAt =
          sessions.length > 0
            ? sessions.reduce(
                (latest, s) =>
                  s.lastActiveAt > latest ? s.lastActiveAt : latest,
                sessions[0].lastActiveAt,
              )
            : now;

        const loginAt =
          sessions.length > 0
            ? sessions.reduce(
                (earliest, s) =>
                  s.createdAt < earliest ? s.createdAt : earliest,
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
      }),
    );

    // 按最后活跃时间倒序
    items.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));

    return { items, total };
  }

  async getUserSessions(userId: string): Promise<SessionDetailDto[]> {
    return this.tokenService.getUserSessions(userId);
  }

  async kickUser(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
    await this.permissionCache.del(userId);
  }

  async kickUserSession(userId: string, tokenHash: string): Promise<void> {
    await this.tokenService.revokeRefreshTokenByHash(userId, tokenHash);
  }
}
