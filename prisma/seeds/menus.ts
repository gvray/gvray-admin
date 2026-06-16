import { PrismaClient } from '@prisma/client';

const ROOT_PARENT_ID = '00000000-0000-0000-0000-000000000000';

interface MenuNode {
  type: 'CATALOG' | 'MENU';
  name: string;
  permissionCode?: string; // 绑定 API 权限码，如 system:user:list
  path: string;
  icon?: string;
  sort?: number;
  children?: MenuNode[];
}

export async function seedMenus(prisma: PrismaClient) {
  console.log('🔐 开始创建菜单数据...');

  const menuTree: MenuNode[] = [
    {
      type: 'CATALOG',
      name: '系统管理',
      path: '/system',
      icon: 'SettingOutlined',
      sort: 0,
      children: [
        {
          type: 'MENU',
          name: '用户管理',
          permissionCode: 'system:user:list',
          path: '/system/user',
          icon: 'UserOutlined',
          sort: 1,
        },
        {
          type: 'MENU',
          name: '角色管理',
          permissionCode: 'system:role:list',
          path: '/system/role',
          icon: 'TeamOutlined',
          sort: 2,
        },
        {
          type: 'MENU',
          name: '权限管理',
          permissionCode: 'system:permission:list',
          path: '/system/permission',
          icon: 'SafetyCertificateOutlined',
          sort: 3,
        },
        {
          type: 'MENU',
          name: '菜单管理',
          permissionCode: 'system:menu:list',
          path: '/system/menu',
          icon: 'MenuOutlined',
          sort: 4,
        },
        {
          type: 'MENU',
          name: '部门管理',
          permissionCode: 'system:department:list',
          path: '/system/department',
          icon: 'ApartmentOutlined',
          sort: 5,
        },
        {
          type: 'MENU',
          name: '岗位管理',
          permissionCode: 'system:position:list',
          path: '/system/position',
          icon: 'IdcardOutlined',
          sort: 6,
        },
        {
          type: 'MENU',
          name: '字典管理',
          permissionCode: 'system:dictionary:list',
          path: '/system/dictionary',
          icon: 'BookOutlined',
          sort: 7,
        },
        {
          type: 'MENU',
          name: '配置管理',
          permissionCode: 'system:config:list',
          path: '/system/config',
          icon: 'ToolOutlined',
          sort: 8,
        },
        {
          type: 'CATALOG',
          name: '日志管理',
          path: '/system/log',
          icon: 'FileTextOutlined',
          sort: 9,
          children: [
            {
              type: 'MENU',
              name: '登录日志',
              permissionCode: 'system:log-login:list',
              path: '/system/log/login',
              icon: 'LoginOutlined',
              sort: 1,
            },
            {
              type: 'MENU',
              name: '操作日志',
              permissionCode: 'system:log-operation:list',
              path: '/system/log/operation',
              icon: 'AuditOutlined',
              sort: 2,
            },
          ],
        },
      ],
    },
  ];

  async function createMenuNode(node: MenuNode, parentId?: string) {
    const parentMenuId = parentId || ROOT_PARENT_ID;
    const menu = await prisma.menu.upsert({
      where: { path: node.path },
      update: {
        name: node.name,
        type: node.type,
        parentMenuId,
        permissionCode: node.permissionCode ?? null,
        path: node.path,
        icon: node.icon,
        hidden: false,
        sort: node.sort ?? 0,
      },
      create: {
        name: node.name,
        type: node.type,
        parentMenuId,
        permissionCode: node.permissionCode ?? null,
        path: node.path,
        icon: node.icon,
        hidden: false,
        sort: node.sort ?? 0,
      },
    });

    if (node.children) {
      for (const child of node.children) {
        await createMenuNode(child, menu.menuId);
      }
    }
  }

  for (const root of menuTree) {
    await createMenuNode(root);
  }

  console.log('✅ 菜单数据创建完成');
}
