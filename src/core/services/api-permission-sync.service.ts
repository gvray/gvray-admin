import {
  Injectable,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { PrismaService } from '@/prisma/prisma.service';
import { PERMISSIONS_KEY } from '@/core/decorators/permissions.decorator';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ApiPermissionSyncService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  private guessAction(methodPath: string, httpMethod: string): string {
    const segs = methodPath
      .split('/')
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    const isIdRoute = segs.some((s) => s.startsWith(':'));

    if (segs.includes('export')) return 'export';
    if (segs.includes('import')) return 'import';
    if (segs.includes('scan')) return 'scan';
    if (segs.includes('clear')) return 'clear';
    if (segs.includes('clean')) return 'clean';
    if (segs.includes('reset') && segs.includes('password'))
      return 'reset-password';
    if (segs.includes('permissions')) return 'update-permissions';
    if (segs.includes('roles')) return 'update-roles';
    if (segs.includes('users')) return 'update-users';
    if (segs.includes('data-scope')) return 'update-data-scope';

    switch (httpMethod.toUpperCase()) {
      case 'GET':
        return isIdRoute ? 'view' : 'list';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'access';
    }
  }

  async onApplicationBootstrap() {
    // 预加载已有权限（包含已软删除的），避免 N+1 查询
    const existingPerms = await this.prisma.permission.findMany({
      select: { code: true, deletedAt: true },
    });
    const existingSet = new Set(existingPerms.map((p) => p.code));
    const softDeletedSet = new Set(
      existingPerms
        .filter((p) => p.deletedAt !== null)
        .map((p) => p.code),
    );

    const metadataScanner = new MetadataScanner();
    const controllers = this.discovery.getControllers();
    const report: Array<{
      code: string;
      action: string;
      controller: string;
      method: string;
      httpMethod: string;
      route: string;
      resource: string;
      status: 'created' | 'exists' | 'reactivated' | 'skipped';
    }> = [];

    for (const controllerRef of controllers) {
      const metatype = (controllerRef as any).metatype;
      if (!metatype) continue;
      const prototype = metatype.prototype;
      const controllerPath: string =
        this.reflector.get<string>(PATH_METADATA, metatype) || '';
      const ctrlSegs = controllerPath.split('/').filter(Boolean);
      const moduleKey = ctrlSegs.length > 0 ? ctrlSegs[0] : 'core';

      const methodNames = metadataScanner.getAllMethodNames(prototype);
      for (const methodName of methodNames) {
        const methodRef = prototype[methodName];
        if (!methodRef) continue;

        const codes: string[] =
          this.reflector.get<string[]>(PERMISSIONS_KEY, methodRef) || [];
        const methodPath: string =
          this.reflector.get<string>(PATH_METADATA, methodRef) || '';
        const requestMethod: RequestMethod =
          this.reflector.get<RequestMethod>(METHOD_METADATA, methodRef) ??
          RequestMethod.ALL;
        const httpMethod = RequestMethod[requestMethod] ?? 'ALL';

        // 解析 resource：优先从控制器路径 /<module>/<resource> 推断
        let resource = ctrlSegs[1] || '';

        for (const code of codes) {
          if (!code || code === '*:*:*') continue;
          const parts = code.split(':');
          // 格式：domain:resource:action
          if (parts.length < 3) continue;
          const domain = parts[0];
          const resourcePart = parts[1];
          const action = parts.slice(2).join(':') || this.guessAction(methodPath, httpMethod);
          resource = resourcePart || resource;

          const resourceKey = `${domain}:${resource}`;

          const exists = existingSet.has(code);
          const wasSoftDeleted = softDeletedSet.has(code);
          report.push({
            code,
            action,
            controller: metatype?.name ?? '',
            method: methodName,
            httpMethod,
            route: `/${[controllerPath, methodPath]
              .map((s) => s.replace(/^\/|\/$/g, ''))
              .filter(Boolean)
              .join('/')}`,
            resource: resourceKey,
            status: exists
              ? wasSoftDeleted
                ? 'reactivated'
                : 'exists'
              : 'created',
          });
        }
      }
    }

    // 写出报告
    try {
      const outDir = path.join(process.cwd(), 'reports');
      await fs.mkdir(outDir, { recursive: true });
      const outFile = path.join(outDir, 'permissions.json');

      // 稳定排序
      const sorted = [...report].sort((a, b) => {
        const byCode = a.code.localeCompare(b.code);
        if (byCode !== 0) return byCode;
        const byRoute = a.route.localeCompare(b.route);
        if (byRoute !== 0) return byRoute;
        return a.method.localeCompare(b.method);
      });

      await fs.writeFile(outFile, JSON.stringify(sorted, null, 2), 'utf8');
      console.log(`权限扫描报告已生成: ${outFile}`);
    } catch (e) {
      console.warn('写出权限扫描报告失败:', e);
    }
  }
}
