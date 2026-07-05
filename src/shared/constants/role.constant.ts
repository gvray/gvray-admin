/**
 * 角色常量
 */

// 超级管理员角色键名
export const SUPER_ROLE_KEY = 'super_admin';

// 超级管理员角色名称
export const SUPER_ROLE_NAME = '超级管理员';

// 管理员角色键名
export const ADMIN_ROLE_KEY = 'admin';

// 游客角色键名
export const GUEST_ROLE_KEY = 'guest';

// ==================== 角色模板规则（代码枚举，不可前端配置） ====================
export interface RoleTemplateRule {
  maxRoleLevel: number;
  excludeTags?: string[];
}

/** 角色模板规则映射（与数据库 role_templates 表的 templateKey 对应） */
export const ROLE_TEMPLATE_RULES: Record<string, RoleTemplateRule> = {
  super_admin: { maxRoleLevel: 999 },
  admin: { maxRoleLevel: 1, excludeTags: ['super-admin-only'] },
  user: { maxRoleLevel: 0 },
};
