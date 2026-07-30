import { PrismaClient } from '@prisma/client';
import {
  PERMISSIONS,
  PERMISSION_METADATA_MAP,
} from '../../src/shared/constants/permissions.constant';
import {
  SUPER_ROLE_KEY,
  ADMIN_ROLE_KEY,
  GUEST_ROLE_KEY,
} from '../../src/shared/constants/role.constant';

export async function seedPermissionsAndAssignments(prisma: PrismaClient) {
  console.log('开始创建权限并分配系统角色权限...');

  // 1. 收集所有权限 code
  const allCodes: string[] = [];
  for (const group of Object.values(PERMISSIONS)) {
    for (const [key, code] of Object.entries(group)) {
      if (typeof code === 'string') {
        allCodes.push(code);
      }
    }
  }

  // admin 不能拥有的敏感权限（从 PERMISSION_METADATA_MAP 中读取）
  const adminExcludedCodes = new Set<string>();
  for (const [code, meta] of PERMISSION_METADATA_MAP.entries()) {
    if (meta.sensitive) {
      adminExcludedCodes.add(code);
    }
  }

  // 2. 创建/更新权限记录（确保存在并修正元数据，被软删除的也恢复）
  // httpMethod 由启动时的扫描器从真实路由装饰器读取并覆盖，seed 只负责占位创建
  for (const code of allCodes) {
    await prisma.permission.upsert({
      where: { code },
      update: {
        name: code,
        origin: 'SYSTEM',
        mutable: false,
        deletedAt: null,
        // httpMethod 不覆盖：已有的记录由扫描器维护，seed 推断不准
      },
      create: {
        code,
        name: code,
        origin: 'SYSTEM',
        mutable: false,
      },
    });
  }
  console.log(`权限记录创建/更新完成: ${allCodes.length} 个`);

  // 3. 查询所有有效权限
  const allPermissions = await prisma.permission.findMany({
    where: { deletedAt: null },
    select: { permissionId: true, code: true },
  });

  // 4. 查询系统角色
  const superRole = await prisma.role.findUnique({
    where: { roleKey: SUPER_ROLE_KEY },
    select: { roleId: true },
  });
  const adminRole = await prisma.role.findUnique({
    where: { roleKey: ADMIN_ROLE_KEY },
    select: { roleId: true },
  });
  const guestRole = await prisma.role.findUnique({
    where: { roleKey: GUEST_ROLE_KEY },
    select: { roleId: true },
  });

  // 5. 给超级管理员分配全部权限
  if (superRole) {
    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({
        roleId: superRole.roleId,
        permissionId: p.permissionId,
      })),
      skipDuplicates: true,
    });
    console.log(`超级管理员权限分配完成: ${allPermissions.length} 个`);
  }

  // 6. 给管理员分配权限（排除敏感权限）
  if (adminRole) {
    const adminPerms = allPermissions.filter(
      (p) => !adminExcludedCodes.has(p.code),
    );
    await prisma.rolePermission.createMany({
      data: adminPerms.map((p) => ({
        roleId: adminRole.roleId,
        permissionId: p.permissionId,
      })),
      skipDuplicates: true,
    });
    console.log(
      `管理员权限分配完成: ${adminPerms.length} 个（排除 ${adminExcludedCodes.size} 个敏感权限）`,
    );
  }

  // 7. 给游客分配全部权限（写操作由 GuestWriteGuard 拦截）
  if (guestRole) {
    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({
        roleId: guestRole.roleId,
        permissionId: p.permissionId,
      })),
      skipDuplicates: true,
    });
    console.log(`游客权限分配完成: ${allPermissions.length} 个`);
  }

  console.log('权限初始化完成');
}
