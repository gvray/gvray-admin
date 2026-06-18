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

export const Roles = (options: RolesOptions): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, options);

export const DenyRoles = (options: DenyRolesOptions): MethodDecorator & ClassDecorator =>
  SetMetadata(DENY_ROLES_KEY, options);
