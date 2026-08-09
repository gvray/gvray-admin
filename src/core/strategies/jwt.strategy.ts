import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type';
import { IUser } from '../interfaces/user.interface';
import { UserStatus } from '@/shared/constants/user-status.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
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
    if (!payload?.sub || !payload.roleKeys) {
      throw new UnauthorizedException('无效的 Access Token');
    }

    if (payload.status && payload.status !== UserStatus.ENABLED) {
      throw new UnauthorizedException('用户已被禁用');
    }

    return {
      userId: payload.sub,
      email: payload.email ?? null,
      username: payload.username,
      nickname: payload.nickname,
      avatar: payload.avatar ?? null,
      status: payload.status || UserStatus.ENABLED,
      createdAt: new Date(payload.iat * 1000),
      updatedAt: new Date(payload.iat * 1000),
      roles: payload.roleKeys.map((roleKey) => ({
        roleId: '',
        name: roleKey,
        roleKey,
        description: null,
        createdAt: new Date(payload.iat * 1000),
        updatedAt: new Date(payload.iat * 1000),
        permissions: [],
      })),
    };
  }
}
