import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const DENY_ROLES_KEY = 'denyRoles';

export interface RolesOptions {
  roles: string[];
  message?: string;
}

export interface DenyRolesOptions {
  roles: string[];
  message?: string;
}

/** `roles` 填 roleKey（如 'admin'），不是 role.name */
export const Roles = (
  options: RolesOptions,
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, options);

export const DenyRoles = (
  options: DenyRolesOptions,
): MethodDecorator & ClassDecorator => SetMetadata(DENY_ROLES_KEY, options);
