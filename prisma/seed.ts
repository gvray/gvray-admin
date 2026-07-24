import { PrismaClient } from '@prisma/client';
import { seedMenus } from './seeds/menus';
import { seedDepartments } from './seeds/department';
import { seedPositions } from './seeds/positions';
import { seedRoles } from './seeds/roles';
import { seedUsers } from './seeds/users';
import { seedDictionaries } from './seeds/dictionaries';
import { seedConfigs } from './seeds/configs';
import { seedPermissionsAndAssignments } from './seeds/permissions';
import { seedNotices } from './seeds/notices';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 1. 初始化菜单数据（目录 + 菜单）
  await seedMenus(prisma);

  // 2. 创建部门
  const { itDepartment, hrDepartment } = await seedDepartments(prisma);

  // 3. 创建岗位
  const { managerPosition, hrPosition } = await seedPositions(prisma);

  // 4. 创建角色
  const { superRole, adminRole, userRole, guestRole } = await seedRoles(prisma);

  // 5. 创建权限并分配系统角色权限
  await seedPermissionsAndAssignments(prisma);

  // 6. 创建用户
  const { superUser, adminUser } = await seedUsers(
    prisma,
    { itDepartment, hrDepartment },
    { managerPosition, hrPosition },
    { superRole, adminRole, userRole, guestRole },
  );

  // 6. 创建通知通告数据
  await seedNotices(prisma);

  // 7. 创建字典数据
  await seedDictionaries(prisma);

  // 8. 创建配置数据
  await seedConfigs();

  console.log('数据库初始化完成！');
  const seedPassword = process.env.SUPER_ADMIN_INITIAL_PASSWORD || '未设置';

  console.log('超级管理员账户信息:');
  console.log(`  邮箱: ${superUser.email}`);
  console.log(`  用户名: ${superUser.username}`);
  console.log(`  手机号: ${superUser.phone}`);
  console.log(`  密码: ${seedPassword}`);

  console.log('管理员账户信息:');
  console.log(`  邮箱: ${adminUser.email}`);
  console.log(`  用户名: ${adminUser.username}`);
  console.log(`  手机号: ${adminUser.phone}`);
  console.log(`  密码: ${seedPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
