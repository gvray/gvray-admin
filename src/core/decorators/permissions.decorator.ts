import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * 权限装饰器
 * 声明控制器方法所需的权限代码
 * @param permissions 权限代码，例如 'system:user:create'
 * @example @RequirePermissions('system:user:create')
 */
export const RequirePermissions = (...permissions: string[]) => {
  return SetMetadata(PERMISSIONS_KEY, permissions);
};
