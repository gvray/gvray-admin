/**
 * 权限常量配置
 * 统一管理所有权限代码，供后端控制器和前端使用
 *
 * 命名规范：{module}:{resource}:{action}
 * - module: 模块名（如 system）
 * - resource: 资源名（如 user, role）
 * - action: 操作名（必须使用标准 action 词库）
 */

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
  LIST: `${USER_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${USER_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  CREATE: `${USER_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${USER_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${USER_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
  IMPORT: `${USER_RESOURCE}:${PERMISSION_ACTIONS.IMPORT}`,
  EXPORT: `${USER_RESOURCE}:${PERMISSION_ACTIONS.EXPORT}`,
  UPDATE_ROLES: `${USER_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_ROLES}`,
  RESET_PASSWORD: `${USER_RESOURCE}:${PERMISSION_ACTIONS.RESET_PASSWORD}`,
} as const;

// ==================== 角色管理权限 ====================
const ROLE_RESOURCE = 'system:role';
export const ROLE_PERMISSIONS = {
  LIST: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  CREATE: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
  UPDATE_PERMISSIONS: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_PERMISSIONS}`,
  UPDATE_USERS: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_USERS}`,
  UPDATE_DATA_SCOPE: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE_DATA_SCOPE}`,
} as const;

// ==================== 权限管理权限 ====================
const PERMISSION_RESOURCE = 'system:permission';
export const PERMISSION_PERMISSIONS = {
  LIST: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  UPDATE: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  SCAN: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.SCAN}`,
} as const;

// ==================== 部门管理权限 ====================
const DEPARTMENT_RESOURCE = 'system:department';
export const DEPARTMENT_PERMISSIONS = {
  LIST: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  CREATE: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 岗位管理权限 ====================
const POSITION_RESOURCE = 'system:position';
export const POSITION_PERMISSIONS = {
  LIST: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  CREATE: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 字典管理权限 ====================
const DICTIONARY_RESOURCE = 'system:dictionary';
export const DICTIONARY_PERMISSIONS = {
  LIST: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  CREATE: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 配置管理权限 ====================
const CONFIG_RESOURCE = 'system:config';
export const CONFIG_PERMISSIONS = {
  LIST: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  CREATE: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 日志管理权限 ====================
const LOG_RESOURCE = 'system:log';
export const LOG_PERMISSIONS = {
  VIEW: `${LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
} as const;

// ==================== 登录日志权限 ====================
const LOGIN_LOG_RESOURCE = 'system:log-login';
export const LOGIN_LOG_PERMISSIONS = {
  LIST: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  DELETE: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
  CLEAN: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAN}`,
  CLEAR: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAR}`,
} as const;

// ==================== 操作日志权限 ====================
const OPERATION_LOG_RESOURCE = 'system:log-operation';
export const OPERATION_LOG_PERMISSIONS = {
  LIST: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,
  DELETE: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
  CLEAN: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAN}`,
  CLEAR: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.CLEAR}`,
} as const;

// ==================== 导出所有权限配置 ====================
export const PERMISSIONS = {
  USER: USER_PERMISSIONS,
  ROLE: ROLE_PERMISSIONS,
  PERMISSION: PERMISSION_PERMISSIONS,
  DEPARTMENT: DEPARTMENT_PERMISSIONS,
  POSITION: POSITION_PERMISSIONS,
  DICTIONARY: DICTIONARY_PERMISSIONS,
  CONFIG: CONFIG_PERMISSIONS,
  LOG: LOG_PERMISSIONS,
  LOGIN_LOG: LOGIN_LOG_PERMISSIONS,
  OPERATION_LOG: OPERATION_LOG_PERMISSIONS,
} as const;

export interface PermissionMeta {
  code: string;
  name: string;
  description?: string;
  type: 'API';
}

// ==================== 权限中文映射（供前端组权限树） ====================
export const PERMISSION_DOMAIN_LABELS: Record<string, string> = {
  system: '系统管理',
};

export const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  user: '用户管理',
  role: '角色管理',
  permission: '权限管理',
  department: '部门管理',
  position: '岗位管理',
  dictionary: '字典管理',
  config: '配置管理',
  log: '日志管理',
  'log-login': '登录日志',
  'log-operation': '操作日志',
};

export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  list: '列表',
  view: '查看',
  create: '创建',
  update: '更新',
  delete: '删除',
  clean: '清理历史',
  clear: '清空全部',
  import: '导入',
  export: '导出',
  scan: '扫描',
  'update-users': '管理用户',
  'update-roles': '管理角色',
  'update-permissions': '管理权限',
  'update-data-scope': '管理数据权限',
  'reset-password': '重置密码',
};
