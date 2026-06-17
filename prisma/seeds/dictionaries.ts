import { PrismaClient } from '@prisma/client';
import { CommonStatus } from '../../src/shared/constants/common-status.constant';

export async function seedDictionaries(prisma: PrismaClient) {
  console.log('🌐 开始创建完整字典数据（批量插入优化）...');

  // 字典类型
  const dictionaryTypes = [
    {
      code: 'common_status',
      name: '通用状态',
      description: '通用启用/禁用/审核中/封禁（适用于用户、角色、部门、岗位、字典、配置等）',
      sort: 0,
    },
    {
      code: 'user_gender',
      name: '用户性别',
      description: '用户性别字典',
      sort: 1,
    },
    {
      code: 'data_scope',
      name: '数据权限范围',
      description: '角色数据权限范围',
      sort: 2,
    },
    {
      code: 'login_type',
      name: '登录类型',
      description: '登录方式类型',
      sort: 3,
    },
    {
      code: 'config_group',
      name: '配置分组',
      description: '系统配置分组',
      sort: 4,
    },
    {
      code: 'config_type',
      name: '配置类型',
      description: '系统配置数据类型',
      sort: 5,
    },
  ];

  // 批量 upsert 字典类型
  const createdTypes: any[] = [];
  for (const typeData of dictionaryTypes) {
    const type = await prisma.dictionaryType.upsert({
      where: { code: typeData.code },
      update: {},
      create: { ...typeData, status: CommonStatus.ENABLED },
    });
    createdTypes.push(type);
  }
  console.log(`✅ 完成字典类型初始化，共 ${createdTypes.length} 条`);

  // 字典项数据
  const dictionaryItems = [
    {
      typeCode: 'common_status',
      items: [
        { value: 'enabled', label: '启用', sort: 0 },
        { value: 'disabled', label: '禁用', sort: 1 },
        { value: 'pending', label: '审核中', sort: 2 },
        { value: 'banned', label: '封禁', sort: 3 },
      ],
    },
    {
      typeCode: 'user_gender',
      items: [
        { value: 'unknown', label: '未知', sort: 0 },
        { value: 'male', label: '男', sort: 1 },
        { value: 'female', label: '女', sort: 2 },
        { value: 'other', label: '其他', sort: 3 },
      ],
    },
    {
      typeCode: 'data_scope',
      items: [
        { value: '1', label: '仅本人', sort: 0 },
        { value: '2', label: '本部门', sort: 1 },
        { value: '3', label: '本部门及以下', sort: 2 },
        { value: '4', label: '自定义', sort: 3 },
        { value: '5', label: '全部', sort: 4 },
      ],
    },
    {
      typeCode: 'login_type',
      items: [
        { value: 'username', label: '用户名', sort: 0 },
        { value: 'email', label: '邮箱', sort: 1 },
        { value: 'phone', label: '手机号', sort: 2 },
        { value: 'wechat', label: '微信', sort: 3 },
        { value: 'qq', label: 'QQ', sort: 4 },
        { value: 'alipay', label: '支付宝', sort: 5 },
        { value: 'github', label: 'GitHub', sort: 6 },
        { value: 'google', label: 'Google', sort: 7 },
      ],
    },
    {
      typeCode: 'config_group',
      items: [
        { value: 'system', label: '系统配置', description: '系统基础信息配置', sort: 0 },
        { value: 'security', label: '安全配置', description: '密码策略、登录策略、JWT策略', sort: 1 },
        { value: 'user', label: '用户配置', description: '用户注册、默认角色、默认头像', sort: 2 },
        { value: 'ui', label: '界面配置', description: '主题、布局、语言等界面设置', sort: 3 },
        { value: 'feature', label: '功能开关', description: '系统功能启停控制', sort: 4 },
        { value: 'storage', label: '存储配置', description: 'OSS、COS、MinIO、本地存储', sort: 5 },
        { value: 'oauth', label: '第三方登录', description: 'GitHub、Google、微信登录', sort: 6 },
        { value: 'mail', label: '邮件配置', description: 'SMTP邮件服务配置', sort: 7 },
        { value: 'sms', label: '短信配置', description: '短信验证码服务配置', sort: 8 },
      ],
    },
    {
      typeCode: 'config_type',
      items: [
        { value: 'string', label: '字符串', sort: 0 },
        { value: 'number', label: '数字', sort: 1 },
        { value: 'boolean', label: '布尔值', sort: 2 },
        { value: 'json', label: 'JSON对象', sort: 3 },
      ],
    },
  ];

  // 先删除所有现有的字典项，然后重新创建以确保唯一性
  console.log('🗑️ 清理现有字典项...');
  await prisma.dictionaryItem.deleteMany({});

  // 批量准备字典项
  const allItems: any[] = [];
  for (const group of dictionaryItems) {
    const type = createdTypes.find((t) => t.code === group.typeCode);
    if (!type) continue;
    for (const item of group.items) {
      allItems.push({
        typeCode: type.code,
        value: item.value,
        label: item.label,
        description: null,
        sort: item.sort,
        status: CommonStatus.ENABLED,
        remark: null,
      });
    }
  }

  // 批量插入字典项
  await prisma.dictionaryItem.createMany({
    data: allItems,
  });

  console.log(`✅ 完成字典项初始化，共 ${allItems.length} 项`);
  console.log('✅ 全部系统字典数据创建完成（确保唯一性）');
}
