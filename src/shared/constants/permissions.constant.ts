/**
 * 权限常量配置
 * 统一管理所有权限代码，供后端控制器和前端使用
 *
 * 命名规范：{module}:{resource}:{action}
 * - module: 模块名（如 system）
 * - resource: 资源名（如 user, role）
 * - action: 操作名（必须使用标准 action 词库）
 */

// ==================== 权限元数据 ====================
export interface PermissionMeta {
  level?: number; // 0=普通, 1=管理员, 2=超管
  tags?: string[];
}

const metaMap = new Map<string, PermissionMeta>();

/**
 * 定义权限代码并记录元数据（供扫描器写入数据库）
 * @param code 权限代码
 * @param meta 元数据（level / tags）
 * @returns 权限代码
 */
export function definePermission(
  code: string,
  meta: PermissionMeta = {},
): string {
  metaMap.set(code, meta);
  return code;
}

/** 权限代码 → 元数据映射（扫描器使用） */
export const PERMISSION_METADATA_MAP = metaMap;

// ==================== 标准 Action 词库 ====================
export const PERMISSION_ACTIONS = {
  // 查询
  LIST: 'list',
  VIEW: 'view',

  // CRUD
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',

  // 数据管理
  CLEAN: 'clean', // 清理历史数据（按条件）
  CLEAR: 'clear', // 清空全部数据（危险）

  // 数据交换
  IMPORT: 'import',
  EXPORT: 'export',

  // 特殊操作
  SCAN: 'scan',

  // 关系管理（update- 前缀，覆盖分配与移除）
  UPDATE_USERS: 'update-users',
  UPDATE_ROLES: 'update-roles',
  UPDATE_PERMISSIONS: 'update-permissions',
  UPDATE_DATA_SCOPE: 'update-data-scope',

  // 其他
  RESET_PASSWORD: 'reset-password',
} as const;

// ==================== 用户管理权限 ====================
const USER_RESOURCE = 'system:user';
export const USER_PERMISSIONS = {
  LIST: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  CREATE: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`),
  UPDATE: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`),
  DELETE: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
  IMPORT: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.IMPORT}`),
  EXPORT: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.EXPORT}`),
  UPDATE_ROLES: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_ROLES}`),
  RESET_PASSWORD: definePermission(`${USER_RESOURCE}:${PERMISSION_ACTIONS.RESET_PASSWORD}`),
} as const;

// ==================== 角色管理权限 ====================
const ROLE_RESOURCE = 'system:role';
export const ROLE_PERMISSIONS = {
  LIST: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  CREATE: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`),
  UPDATE: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`),
  DELETE: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
  UPDATE_PERMISSIONS: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_PERMISSIONS}`),
  UPDATE_USERS: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_USERS}`),
  UPDATE_DATA_SCOPE: definePermission(`${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_DATA_SCOPE}`),
} as const;

// ==================== 权限管理权限 ====================
const PERMISSION_RESOURCE = 'system:permission';
export const PERMISSION_PERMISSIONS = {
  LIST: definePermission(`${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  UPDATE: definePermission(`${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`),
  SCAN: definePermission(`${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.SCAN}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
} as const;

// ==================== 部门管理权限 ====================
const DEPARTMENT_RESOURCE = 'system:department';
export const DEPARTMENT_PERMISSIONS = {
  LIST: definePermission(`${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  CREATE: definePermission(`${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`),
  UPDATE: definePermission(`${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`),
  DELETE: definePermission(`${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
} as const;

// ==================== 岗位管理权限 ====================
const POSITION_RESOURCE = 'system:position';
export const POSITION_PERMISSIONS = {
  LIST: definePermission(`${POSITION_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${POSITION_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  CREATE: definePermission(`${POSITION_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`),
  UPDATE: definePermission(`${POSITION_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`),
  DELETE: definePermission(`${POSITION_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
} as const;

// ==================== 字典管理权限 ====================
const DICTIONARY_RESOURCE = 'system:dictionary';
export const DICTIONARY_PERMISSIONS = {
  LIST: definePermission(`${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  CREATE: definePermission(`${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`),
  UPDATE: definePermission(`${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`),
  DELETE: definePermission(`${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
} as const;

// ==================== 配置管理权限 ====================
const CONFIG_RESOURCE = 'system:config';
export const CONFIG_PERMISSIONS = {
  LIST: definePermission(`${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  CREATE: definePermission(`${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
  UPDATE: definePermission(`${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
  DELETE: definePermission(`${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
} as const;

// ==================== 菜单管理权限 ====================
const MENU_RESOURCE = 'system:menu';
export const MENU_PERMISSIONS = {
  LIST: definePermission(`${MENU_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${MENU_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  CREATE: definePermission(`${MENU_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`),
  UPDATE: definePermission(`${MENU_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`),
  DELETE: definePermission(`${MENU_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
} as const;

// ==================== 日志管理权限 ====================
const LOG_RESOURCE = 'system:log';
export const LOG_PERMISSIONS = {
  VIEW: definePermission(`${LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
} as const;

// ==================== 登录日志权限 ====================
const LOGIN_LOG_RESOURCE = 'system:log-login';
export const LOGIN_LOG_PERMISSIONS = {
  LIST: definePermission(`${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  DELETE: definePermission(`${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
  CLEAN: definePermission(`${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAN}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
  CLEAR: definePermission(`${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAR}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
} as const;

// ==================== 操作日志权限 ====================
const OPERATION_LOG_RESOURCE = 'system:log-operation';
export const OPERATION_LOG_PERMISSIONS = {
  LIST: definePermission(`${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
  DELETE: definePermission(`${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`),
  CLEAN: definePermission(`${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAN}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
  CLEAR: definePermission(`${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAR}`, {
    level: 2,
    tags: ['super-admin-only'],
  }),
} as const;

// ==================== 系统监控权限 ====================
const MONITOR_RESOURCE = 'monitor:server';
export const MONITOR_PERMISSIONS = {
  LIST: definePermission(`${MONITOR_RESOURCE}:${PERMISSION_ACTIONS.LIST}`),
  VIEW: definePermission(`${MONITOR_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`),
} as const;

// ==================== 超管专属权限 ====================
/**
 * @deprecated 请改用 PERMISSION_METADATA_MAP 或查询数据库 roleLevel/tags
 */
export const SUPER_ADMIN_ONLY_PERMISSIONS: readonly string[] = [
  CONFIG_PERMISSIONS.CREATE,
  CONFIG_PERMISSIONS.UPDATE,
  CONFIG_PERMISSIONS.DELETE,
  PERMISSION_PERMISSIONS.SCAN,
  LOGIN_LOG_PERMISSIONS.CLEAR,
  LOGIN_LOG_PERMISSIONS.CLEAN,
  OPERATION_LOG_PERMISSIONS.CLEAR,
  OPERATION_LOG_PERMISSIONS.CLEAN,
] as const;

// ==================== 导出所有权限配置 ====================
export const PERMISSIONS = {
  USER: USER_PERMISSIONS,
  ROLE: ROLE_PERMISSIONS,
  PERMISSION: PERMISSION_PERMISSIONS,
  DEPARTMENT: DEPARTMENT_PERMISSIONS,
  POSITION: POSITION_PERMISSIONS,
  DICTIONARY: DICTIONARY_PERMISSIONS,
  CONFIG: CONFIG_PERMISSIONS,
  MENU: MENU_PERMISSIONS,
  LOG: LOG_PERMISSIONS,
  LOGIN_LOG: LOGIN_LOG_PERMISSIONS,
  OPERATION_LOG: OPERATION_LOG_PERMISSIONS,
  MONITOR: MONITOR_PERMISSIONS,
} as const;

