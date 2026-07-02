import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_GUEST_WRITE_KEY } from '../decorators/allow-guest-write.decorator';
import { GUEST_ROLE_KEY } from '../../shared/constants/role.constant';
import { IUser } from '../interfaces/user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

interface GuestWriteRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: IUser | null;
}

/**
 * 游客写操作拦截守卫
 * 游客拥有全部权限点（前端按钮可见），但禁止执行任何写操作
 * 被 @AllowGuestWrite() 标记的端点除外
 */
@Injectable()
export class GuestWriteGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowGuestWrite = this.reflector.getAllAndOverride<boolean>(
      ALLOW_GUEST_WRITE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowGuestWrite) {
      return true;
    }

    const request = context.switchToHttp().getRequest<GuestWriteRequest>();
    const method = request.method?.toUpperCase();
    if (!method || !WRITE_METHODS.includes(method)) {
      return true;
    }

    let user: IUser | undefined = request.user ?? undefined;
    if (!user && this.shouldAuthenticate(context, request)) {
      user = await this.authenticateRequest(context);
    }

    // 未认证用户直接放行，让 JwtAuthGuard 处理
    if (!user?.roles) {
      return true;
    }

    const isGuest = user.roles.some((role) => role.roleKey === GUEST_ROLE_KEY);
    if (!isGuest) {
      return true;
    }

    throw new ForbiddenException('演示环境，游客账号仅支持查看操作');
  }

  handleRequest<TUser = IUser | null>(
    _err: unknown,
    user: TUser | false | null,
  ): TUser {
    return (user || null) as TUser;
  }

  protected async authenticateRequest(
    context: ExecutionContext,
  ): Promise<IUser | undefined> {
    const request = context.switchToHttp().getRequest<GuestWriteRequest>();

    try {
      await super.canActivate(context);
    } catch {
      return undefined;
    }

    return request.user ?? undefined;
  }

  private shouldAuthenticate(
    context: ExecutionContext,
    request: GuestWriteRequest,
  ): boolean {
    return this.hasBearerToken(request) && this.hasJwtAuthGuard(context);
  }

  private hasJwtAuthGuard(context: ExecutionContext): boolean {
    const guards =
      this.reflector.getAllAndMerge<unknown[]>(GUARDS_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    return guards.some((guard) => guard === JwtAuthGuard);
  }

  private hasBearerToken(request: GuestWriteRequest): boolean {
    const authorization = request.headers?.authorization;
    if (Array.isArray(authorization)) {
      return authorization.some((value) => this.isBearerToken(value));
    }

    return this.isBearerToken(authorization);
  }

  private isBearerToken(value: string | undefined): boolean {
    return value?.trim().toLowerCase().startsWith('bearer ') ?? false;
  }
}
