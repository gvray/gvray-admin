import { Injectable, Logger, OnApplicationBootstrap, RequestMethod } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { PrismaService } from '@/prisma/prisma.service';
import { PERMISSIONS_KEY } from '@/core/decorators/permissions.decorator';
import { SUPER_ROLE_KEY, ADMIN_ROLE_KEY, GUEST_ROLE_KEY } from '@/shared/constants/role.constant';

interface ScannedPermission {
  code: string;
  name: string;
  httpMethod: string;
  path: string;
  controller: string;
}

@Injectable()
export class PermissionsScannerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionsScannerService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async onApplicationBootstrap() {
    await this.scanControllers();
  }

  /**
   * 扫描所有控制器，提取权限
   */
  async scanControllers(): Promise<{
    scanned: number;
    created: number;
    updated: number;
    deleted: number;
    assigned: {
      superAdmin: { newAssigned: number; total: number };
      admin: { newAssigned: number; total: number };
      guest: { newAssigned: number; total: number };
    };
  }> {
    this.logger.log('🔍 开始扫描控制器权限...');

    const controllers = this.discoveryService.getControllers();
    const scannedPermissions: ScannedPermission[] = [];

    for (const wrapper of controllers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const controllerPath = this.getControllerPath(metatype);
      if (!controllerPath) continue;

      const controllerName = metatype.name;

      const methodNames = this.metadataScanner.getAllMethodNames(
        Object.getPrototypeOf(instance),
      );

      for (const methodName of methodNames) {
        const method = instance[methodName];
        if (!method) continue;

        const permissions = this.reflector.get<string[]>(
          PERMISSIONS_KEY,
          method,
        );

        if (!permissions || permissions.length === 0) continue;

        const httpMethod = this.getHttpMethod(instance, methodName);
        const methodPath = this.getMethodPath(instance, methodName);

        if (!httpMethod) continue;

        const fullPath = this.buildFullPath(controllerPath, methodPath);

        for (const permissionCode of permissions) {
          scannedPermissions.push({
            code: permissionCode,
            name: this.generatePermissionName(permissionCode, httpMethod),
            httpMethod,
            path: fullPath,
            controller: controllerName,
          });
        }
      }
    }

    const uniqueCodes = new Set(scannedPermissions.map((p) => p.code));
    this.logger.log(
      `📊 扫描到 ${scannedPermissions.length} 个权限（去重后 ${uniqueCodes.size} 个唯一 code）`,
    );

    const stats = await this.syncPermissions(scannedPermissions);

    this.logger.log('✅ 权限扫描完成');
    this.logger.log(`   - 新增: ${stats.created} 个`);
    this.logger.log(`   - 更新: ${stats.updated} 个`);
    this.logger.log(`   - 删除: ${stats.deleted} 个`);
    this.logger.log(
      `   - 超级管理员: 已绑定 ${stats.assigned.superAdmin.total} 个，本次新增 ${stats.assigned.superAdmin.newAssigned} 个`,
    );
    this.logger.log(
      `   - 管理员: 已绑定 ${stats.assigned.admin.total} 个，本次新增 ${stats.assigned.admin.newAssigned} 个`,
    );
    this.logger.log(
      `   - 游客: 已绑定 ${stats.assigned.guest.total} 个，本次新增 ${stats.assigned.guest.newAssigned} 个`,
    );

    return {
      scanned: scannedPermissions.length,
      ...stats,
    };
  }

  /**
   * 同步权限到数据库
   */
  private async syncPermissions(
    scannedPermissions: ScannedPermission[],
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    assigned: {
      superAdmin: { newAssigned: number; total: number };
      admin: { newAssigned: number; total: number };
      guest: { newAssigned: number; total: number };
    };
  }> {
    let created = 0;
    let updated = 0;

    const existingPermissions = await this.prisma.permission.findMany({
      where: {
        origin: 'SYSTEM',
        deletedAt: null,
      },
      select: {
        permissionId: true,
        code: true,
        name: true,
        httpMethod: true,
      },
    });

    const scannedCodes = new Set(scannedPermissions.map((p) => p.code));

    for (const perm of scannedPermissions) {
      const existing = existingPermissions.find((p) => p.code === perm.code);

      await this.prisma.permission.upsert({
        where: { code: perm.code },
        update: {
          name: perm.name,
          httpMethod: perm.httpMethod,
          origin: 'SYSTEM',
          deletedAt: null,
        },
        create: {
          code: perm.code,
          name: perm.name,
          httpMethod: perm.httpMethod,
          origin: 'SYSTEM',
        },
      });

      if (existing) {
        if (
          existing.name !== perm.name ||
          existing.httpMethod !== perm.httpMethod
        ) {
          updated++;
        }
      } else {
        created++;
      }
    }

    const toDelete = existingPermissions.filter(
      (p) => !scannedCodes.has(p.code),
    );
    let deleted = 0;

    for (const perm of toDelete) {
      await this.prisma.permission.update({
        where: { permissionId: perm.permissionId },
        data: { deletedAt: new Date() },
      });
      deleted++;
    }

    const assigned = await this.assignAllRolePermissions();

    return { created, updated, deleted, assigned };
  }

  /**
   * 为指定角色分配权限
   */
  private async assignPermissionsToRole(
    roleKey: string,
    filter?: { httpMethod?: string },
  ): Promise<{ newAssigned: number; total: number }> {
    const role = await this.prisma.role.findFirst({
      where: { roleKey },
      select: { roleId: true },
    });
    if (!role) return { newAssigned: 0, total: 0 };

    const where: Record<string, unknown> = { deletedAt: null };
    if (filter?.httpMethod) where['httpMethod'] = filter.httpMethod;

    const allPermissions = await this.prisma.permission.findMany({
      where,
      select: { permissionId: true },
    });
    const existingLinks = await this.prisma.rolePermission.findMany({
      where: { roleId: role.roleId },
      select: { permissionId: true },
    });
    const linkedIds = new Set(existingLinks.map((l) => l.permissionId));
    const toAssign = allPermissions.filter(
      (p) => !linkedIds.has(p.permissionId),
    );

    if (toAssign.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: toAssign.map((p) => ({
          roleId: role.roleId,
          permissionId: p.permissionId,
        })),
        skipDuplicates: true,
      });
    }

    const total = await this.prisma.rolePermission.count({
      where: {
        roleId: role.roleId,
        permission: { deletedAt: null },
      },
    });

    return { newAssigned: toAssign.length, total };
  }

  /**
   * 扫描完成后自动分配权限：
   * - super_admin：全部权限
   * - admin：全部权限
   * - guest：仅 GET（查看类）权限
   */
  private async assignAllRolePermissions(): Promise<{
    superAdmin: { newAssigned: number; total: number };
    admin: { newAssigned: number; total: number };
    guest: { newAssigned: number; total: number };
  }> {
    const superAdmin = await this.assignPermissionsToRole(SUPER_ROLE_KEY);
    const admin = await this.assignPermissionsToRole(ADMIN_ROLE_KEY);
    const guest = await this.assignPermissionsToRole(GUEST_ROLE_KEY);

    return { superAdmin, admin, guest };
  }

  /**
   * 获取控制器路径
   */
  private getControllerPath(metatype: any): string | null {
    const path = Reflect.getMetadata('path', metatype);
    return path || null;
  }

  /**
   * 获取 HTTP 方法
   */
  private getHttpMethod(instance: any, methodName: string): string | null {
    const prototype = Object.getPrototypeOf(instance);
    const method = prototype[methodName];
    if (!method) return null;

    const requestMethod = Reflect.getMetadata(METHOD_METADATA, method);
    if (requestMethod !== undefined) {
      return RequestMethod[requestMethod] || null;
    }

    return null;
  }

  /**
   * 获取方法路径
   */
  private getMethodPath(instance: any, methodName: string): string {
    const prototype = Object.getPrototypeOf(instance);
    const method = prototype[methodName];
    if (!method) return '';
    const path = Reflect.getMetadata('path', method);
    return path || '';
  }

  /**
   * 构建完整路径
   */
  private buildFullPath(controllerPath: string, methodPath: string): string {
    const base = controllerPath.startsWith('/')
      ? controllerPath
      : `/${controllerPath}`;
    if (!methodPath) return base;
    const path = methodPath.startsWith('/') ? methodPath : `/${methodPath}`;
    return `${base}${path}`;
  }

  /**
   * 生成权限名称
   */
  private generatePermissionName(code: string, method: string): string {
    const parts = code.split(':');
    const action = parts[parts.length - 1];

    const actionMap: Record<string, string> = {
      list: '获取列表',
      detail: '获取详情',
      create: '创建接口',
      update: '更新接口',
      delete: '删除接口',
      'batch-delete': '批量删除接口',
      'assign-roles': '分配角色接口',
      'remove-roles': '移除角色接口',
      'assign-permissions': '分配权限接口',
      'remove-permissions': '移除权限接口',
      'assign-users': '分配用户接口',
      'remove-users': '移除用户接口',
      'data-scope': '更新数据权限接口',
      'reset-password': '重置密码接口',
      scan: '扫描权限接口',
      clean: '清理数据接口',
      clear: '清空数据接口',
      import: '导入接口',
      export: '导出接口',
      login: '登录接口',
      logout: '登出接口',
      refresh: '刷新令牌接口',
      menus: '获取菜单接口',
      profile: '获取用户信息接口',
      password: '修改密码接口',
      avatar: '上传头像接口',
      overview: '概览接口',
      stats: '统计接口',
      activities: '活动接口',
      view: '查看接口',
    };

    const resource = parts[parts.length - 2];
    const resourceMap: Record<string, string> = {
      user: '用户',
      role: '角色',
      permission: '权限',
      department: '部门',
      position: '岗位',
      dictionary: '字典',
      config: '配置',
      loginlog: '登录日志',
      oplog: '操作日志',
      'log-login': '登录日志',
      'log-operation': '操作日志',
      log: '日志',
      dashboard: '仪表盘',
      profile: '个人信息',
      auth: '认证',
    };

    const resourceName = resourceMap[resource] || resource;
    const actionName = actionMap[action] || action;

    return `${resourceName}${actionName}`;
  }
}
