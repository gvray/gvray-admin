import { PrismaClient } from '@prisma/client';
import { CommonStatus } from '../../src/shared/constants/common-status.constant';

export async function seedRoleTemplates(prisma: PrismaClient) {
  console.log('开始创建角色模板...');

  const templates = [
    {
      templateKey: 'super_admin',
      name: '超级管理员模板',
      description: '拥有全部权限，无限制',
      sort: 0,
    },
    {
      templateKey: 'admin',
      name: '管理员模板',
      description: '拥有管理员及以下权限，排除超管专属',
      sort: 1,
    },
    {
      templateKey: 'user',
      name: '普通用户模板',
      description: '仅拥有普通权限',
      sort: 10,
    },
  ];

  const created: Record<string, { templateId: string; templateKey: string }> = {};

  for (const t of templates) {
    const template = await prisma.roleTemplate.upsert({
      where: { templateKey: t.templateKey },
      update: {},
      create: {
        templateKey: t.templateKey,
        name: t.name,
        description: t.description,
        sort: t.sort,
        status: CommonStatus.ENABLED,
      },
    });
    created[t.templateKey] = {
      templateId: template.templateId,
      templateKey: template.templateKey,
    };
    console.log(`角色模板创建成功: ${template.name}`);
  }

  console.log('角色模板创建完成');
  return created;
}
