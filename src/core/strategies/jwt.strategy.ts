import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type';
import { IUser } from '../interfaces/user.interface';

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
    // 纯 JWT 自验证：只从 payload 提取 userId，其他信息后续按需加载
    return {
      userId: payload.sub,
      email: null,
      username: '',
      nickname: '',
      avatar: null,
      status: 'enabled',
      createdAt: new Date(payload.iat * 1000),
      updatedAt: new Date(payload.iat * 1000),
      roles: [],
    };
  }
}
