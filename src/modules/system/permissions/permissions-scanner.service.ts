import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { PrismaService } from '@/prisma/prisma.service';
import { PERMISSIONS_KEY } from '@/core/decorators/permissions.decorator';
import { PERMISSION_METADATA_MAP } from '@/shared/constants/permissions.constant';

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
    sensitive: string[];
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

    if (stats.sensitive.length > 0) {
      this.logger.warn(`   ⚠️ 敏感权限: ${stats.sensitive.length} 个`);
      for (const code of stats.sensitive) {
        const meta = PERMISSION_METADATA_MAP.get(code);
        this.logger.warn(
          `      - ${code}${meta?.notes ? ` (${meta.notes})` : ''}`,
        );
      }
    }

    return { scanned: scannedPermissions.length, ...stats };
  }

  /**
   * 同步权限到数据库
   * 批量操作，避免逐条 upsert/update 的 N 次 DB 往返。
   */
  private async syncPermissions(
    scannedPermissions: ScannedPermission[],
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    sensitive: string[];
  }> {
    const sensitive: string[] = [];

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

    const existingByCode = new Map(
      existingPermissions.map((p) => [p.code, p]),
    );
    const scannedCodes = new Set(scannedPermissions.map((p) => p.code));

    // 按是否已存在分桶
    const toCreate: ScannedPermission[] = [];
    const toUpdate: ScannedPermission[] = [];
    for (const perm of scannedPermissions) {
      const meta = PERMISSION_METADATA_MAP.get(perm.code);
      if (meta?.sensitive) sensitive.push(perm.code);

      const existing = existingByCode.get(perm.code);
      if (existing) {
        if (
          existing.name !== perm.name ||
          existing.httpMethod !== perm.httpMethod
        ) {
          toUpdate.push(perm);
        }
      } else {
        toCreate.push(perm);
      }
    }

    const created = toCreate.length;
    const updated = toUpdate.length;

    // 批量新建
    if (toCreate.length > 0) {
      await this.prisma.permission.createMany({
        data: toCreate.map((perm) => ({
          code: perm.code,
          name: perm.name,
          httpMethod: perm.httpMethod,
          mutable: false,
          origin: 'SYSTEM',
        })),
        skipDuplicates: true,
      });
    }

    // 批量更新（逐条按 code 精确更新，但只更新有变化的，量通常很小）
    if (toUpdate.length > 0) {
      await this.prisma.$transaction(
        toUpdate.map((perm) =>
          this.prisma.permission.update({
            where: { code: perm.code },
            data: {
              name: perm.name,
              httpMethod: perm.httpMethod,
              mutable: false,
              origin: 'SYSTEM',
              deletedAt: null,
            },
          }),
        ),
      );
    }

    // 批量软删除：扫描结果中不再存在的 SYSTEM 权限
    const toDelete = existingPermissions.filter(
      (p) => !scannedCodes.has(p.code),
    );
    if (toDelete.length > 0) {
      await this.prisma.permission.updateMany({
        where: {
          permissionId: { in: toDelete.map((p) => p.permissionId) },
        },
        data: { deletedAt: new Date() },
      });
    }

    return { created, updated, deleted: toDelete.length, sensitive };
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
