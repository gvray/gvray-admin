import { PrismaClient } from '@prisma/client';

export async function seedNotices(prisma: PrismaClient) {
  console.log('🔔 开始创建通知通告数据...');

  const superUser = await prisma.user.findUnique({
    where: { email: 'super@example.com' },
    select: { userId: true },
  });

  const createdById = superUser?.userId ?? null;

  const notices = [
    {
      noticeId: 'notice-0001',
      title: '系统维护公告',
      content:
        '尊敬的用户，系统将于本周六凌晨 02:00 - 06:00 进行例行维护升级。维护期间部分服务可能暂时不可用，请提前安排好您的工作。如有疑问请联系技术支持。',
      type: 'announcement',
      status: 'enabled',
      sort: 1,
    },
    {
      noticeId: 'notice-0002',
      title: '新功能上线：通知通告模块',
      content:
        '通知通告模块已正式上线！管理员可在系统管理 → 通知通告中发布公告和通知，用户可通过顶部铃铛图标实时查看最新动态。快去体验吧！',
      type: 'notice',
      status: 'enabled',
      sort: 2,
    },
    {
      noticeId: 'notice-0003',
      title: '安全提醒：请定期修改密码',
      content:
        '为了保障您的账户安全，建议您定期修改登录密码，并使用复杂度较高的密码组合。切勿将密码告知他人，发现异常登录请立即联系管理员。',
      type: 'notice',
      status: 'enabled',
      sort: 3,
    },
    {
      noticeId: 'notice-0004',
      title: '2026 年春节放假通知',
      content:
        '根据国家法定节假日安排，2026 年春节放假时间为 2 月 16 日（除夕）至 2 月 22 日（初六），共 7 天。2 月 14 日（周六）、2 月 15 日（周日）正常上班。祝大家新春快乐！',
      type: 'announcement',
      status: 'disabled',
      sort: 4,
    },
    {
      noticeId: 'notice-0005',
      title: '欢迎使用 GVRAY Admin',
      content:
        'GVRAY Admin 是一个基于 NestJS + Prisma + TypeScript 构建的后台管理系统，集成了 RBAC 权限管理、JWT 认证、操作审计、在线用户监控等功能。如有任何问题或建议，欢迎随时反馈。',
      type: 'notice',
      status: 'enabled',
      sort: 0,
    },
  ];

  for (const notice of notices) {
    await prisma.notice.upsert({
      where: { noticeId: notice.noticeId },
      update: {},
      create: {
        ...notice,
        createdById,
      },
    });
  }

  console.log(`✅ 通知通告数据创建完成，共 ${notices.length} 条`);
}
