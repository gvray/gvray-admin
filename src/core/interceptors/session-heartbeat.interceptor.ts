import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from '@/modules/auth/token.service';

/**
 * 会话心跳拦截器
 * 每次经过 JWT 认证的请求，异步更新 Redis 中的最后活跃时间
 * 不影响请求响应，静默忽略错误
 */
@Injectable()
export class SessionHeartbeatInterceptor implements NestInterceptor {
  constructor(private readonly tokenService: TokenService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string } | undefined;
    const authHeader = request.headers?.authorization as string | undefined;

    // 只处理有 JWT 用户和 Bearer token 的请求
    if (user?.userId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // 异步更新，不阻塞请求
      this.tokenService.touchSession(user.userId, token).catch(() => {
        // 静默忽略
      });
    }

    return next.handle();
  }
}
