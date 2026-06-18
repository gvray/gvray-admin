import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_GUEST_WRITE_KEY } from '../decorators/allow-guest-write.decorator';
import { GUEST_ROLE_KEY } from '../../shared/constants/role.constant';
import { IUser } from '../interfaces/user.interface';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * 游客写操作拦截守卫
 * 游客拥有全部权限点（前端按钮可见），但禁止执行任何写操作
 * 被 @AllowGuestWrite() 标记的端点除外
 */
@Injectable()
export class GuestWriteGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowGuestWrite = this.reflector.getAllAndOverride<boolean>(
      ALLOW_GUEST_WRITE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowGuestWrite) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: IUser | undefined = request.user;

    // 未认证用户直接放行，让 JwtAuthGuard 处理
    if (!user || !user.roles) {
      return true;
    }

    const isGuest = user.roles.some(
      (role) => role.roleKey === GUEST_ROLE_KEY,
    );
    if (!isGuest) {
      return true;
    }

    const method = request.method;
    if (WRITE_METHODS.includes(method)) {
      throw new ForbiddenException('演示环境，游客账号仅支持查看操作');
    }

    return true;
  }
}
