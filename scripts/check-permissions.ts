import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const perms = await prisma.permission.findMany({
    where: { deletedAt: null },
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  });
  console.log('Total permissions:', perms.length);
  const dictPerms = perms.filter((p: any) => p.code?.includes('dictionary'));
  console.log('Dictionary permissions:', dictPerms);

  const superRole = await prisma.role.findFirst({ where: { roleKey: 'super_admin' } });
  if (superRole) {
    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId: superRole.roleId },
      include: { permission: { select: { code: true, name: true } } },
    });
    const dictRolePerms = rolePerms.filter((rp: any) => rp.permission?.code?.includes('dictionary'));
    console.log('SuperAdmin dictionary rolePermissions:', dictRolePerms.map((rp: any) => rp.permission.code));
  }
}
main().finally(() => prisma.$disconnect());
