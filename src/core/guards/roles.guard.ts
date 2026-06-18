import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  DENY_ROLES_KEY,
  DenyRolesOptions,
  ROLES_KEY,
  RolesOptions,
} from '../decorators/roles.decorator';
import { IUser } from '../interfaces/user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolesOptions>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const deniedRoles = this.reflector.getAllAndOverride<DenyRolesOptions>(
      DENY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !deniedRoles) {
      return true;
    }

    const { user }: { user: IUser } = context.switchToHttp().getRequest();

    if (
      deniedRoles?.roles.some((roleKey) =>
        user.roles.some((role) => role.roleKey === roleKey),
      )
    ) {
      throw new ForbiddenException(deniedRoles.message ?? '禁止访问');
    }

    if (!requiredRoles) {
      return true;
    }

    const hasRole = user.roles.some((role) =>
      requiredRoles.roles.includes(role.name),
    );
    if (!hasRole) {
      throw new ForbiddenException(requiredRoles.message ?? '暂无权限访问');
    }

    return true;
  }
}
