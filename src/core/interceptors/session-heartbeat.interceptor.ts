import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '@/modules/auth/token.service';

/**
 * 会话心跳拦截器
 * 每次经过 JWT 认证的请求，通过 AT jti 查 Redis 反向索引，异步更新 RT session 最后活跃时间
 */
@Injectable()
export class SessionHeartbeatInterceptor implements NestInterceptor {
  constructor(
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string } | undefined;
    const authHeader = request.headers?.authorization as string | undefined;

    if (user?.userId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.decode(token);
        const jti = payload?.jti;
        if (jti) {
          this.tokenService.touchSessionByJti(jti).catch(() => {});
        }
      } catch {
        // 静默忽略解码失败
      }
    }

    return next.handle();
  }
}
