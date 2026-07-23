import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';
import { IUser } from '../interfaces/user.interface';
import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';
import { UserStatus } from '@/shared/constants/user-status.constant';
import { TokenService } from '@/modules/auth/token.service';

interface DbUser {
  userId: string;
  email: string | null;
  username: string;
  nickname: string;
  avatar: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userRoles: Array<{
    role: {
      roleId: string;
      name: string;
      roleKey: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      rolePermissions: Array<{
        permission: {
          permissionId: string;
          name: string;
          code: string;
          action: string;
          resourceId: string;
          description: string | null;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
    };
  }>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {
    const secretOrKey = configService.get<string>('jwt.secret');
    if (!secretOrKey) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload): Promise<IUser> {
    // 检查 AT 是否在黑名单中
    const isBlacklisted = await this.tokenService.isAccessTokenBlacklisted(
      payload.jti,
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token 已被撤销');
    }

    // 检查用户是否被全局踢出
    const isKickedOut = await this.tokenService.isUserKickedOut(
      payload.sub,
      payload.iat * 1000,
    );
    if (isKickedOut) {
      throw new UnauthorizedException('用户已被强制下线');
    }

    const user = (await this.prisma.user.findUnique({
      where: { userId: payload.sub },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
                roleKey: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        permissionId: true,
                        name: true,
                        code: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })) as DbUser | null;

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    if (user.status !== UserStatus.ENABLED) {
      throw new UnauthorizedException('用户已被禁用');
    }

    return {
      userId: user.userId,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((userRole) => ({
        roleId: userRole.role.roleId,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
        description: userRole.role.description,
        createdAt: userRole.role.createdAt,
        updatedAt: userRole.role.updatedAt,
        permissions: userRole.role.rolePermissions.map((rp) => ({
          permissionId: rp.permission.permissionId,
          name: rp.permission.name,
          code: rp.permission.code,
          description: rp.permission.description,
          createdAt: rp.permission.createdAt,
          updatedAt: rp.permission.updatedAt,
        })),
      })),
    };
  }
}
