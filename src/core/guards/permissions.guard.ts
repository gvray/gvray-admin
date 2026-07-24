import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionCacheService } from '@/redis/permission-cache.service';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly permissionCache: PermissionCacheService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.userId;

    if (!userId) {
      this.logger.log('UserId not found in request');
      return false;
    }

    // 1. 优先从 Redis Permission Cache 取权限
    let userPermissions = await this.permissionCache.get(userId);

    // 2. 未命中则查 DB 并回填缓存
    if (!userPermissions) {
      userPermissions = await this.loadPermissionsFromDb(userId);
      if (userPermissions) {
        await this.permissionCache.set(userId, userPermissions);
      }
    }

    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    // 3. 校验是否拥有所有需要的权限
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions!.includes(permission),
    );

    return hasPermission;
  }

  private async loadPermissionsFromDb(
    userId: string,
  ): Promise<string[] | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) return null;

      const codes = Array.from(
        new Set(
          (user.userRoles || [])
            .flatMap((ur) => ur.role?.rolePermissions || [])
            .map((rp) => rp.permission?.code)
            .filter(
              (code): code is string =>
                typeof code === 'string' && code.length > 0,
            ),
        ),
      );

      return codes;
    } catch {
      return null;
    }
  }
}
