import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const menus = await prisma.menu.findMany({
    where: { status: 'enabled' },
    orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
  });
  console.table(
    menus.map((m: any) => ({
      name: m.name,
      path: m.path,
      permissionCode: m.permissionCode,
      sort: m.sort,
    })),
  );
}
main().finally(() => prisma.$disconnect());
