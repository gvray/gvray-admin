import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { MenuTreeNodeDto, MenuResponseDto } from './dto/menu-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { ROOT_PARENT_ID } from '@/shared/constants/root.constant';
import { PaginationData } from '@/shared/interfaces/response.interface';
import type { Menu as MenuModel } from '@prisma/client';

@Injectable()
export class MenuService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * 验证菜单类型层级关系
   * 规则：
   * - CATALOG 下只能有 CATALOG 或 MENU
   * - MENU 不能有子菜单
   */
  private async validateMenuHierarchy(
    type: string,
    parentMenuId?: string,
  ): Promise<void> {
    if (!parentMenuId || parentMenuId === ROOT_PARENT_ID) {
      if (type !== 'CATALOG') {
        throw new ConflictException('顶层菜单只能是目录类型');
      }
      return;
    }

    const parent = await this.prisma.menu.findUnique({
      where: { menuId: parentMenuId },
      select: { type: true, name: true },
    });

    if (!parent) {
      throw new ConflictException('父菜单不存在');
    }

    if (parent.type === 'CATALOG') {
      if (type !== 'CATALOG' && type !== 'MENU') {
        throw new ConflictException(`目录"${parent.name}"下只能添加目录或菜单`);
      }
    } else {
      throw new ConflictException(`菜单"${parent.name}"不能添加子菜单`);
    }
  }

  async create(
    createMenuDto: CreateMenuDto,
    currentUserId?: string,
  ): Promise<MenuResponseDto> {
    const {
      name,
      type,
      permissionCode,
      path,
      icon,
      hidden,
      sort,
      status,
      parentMenuId,
    } = createMenuDto;

    const existing = await this.prisma.menu.findUnique({
      where: { path },
    });
    if (existing) {
      throw new ConflictException(`菜单路径 "${path}" 已存在`);
    }

    await this.validateMenuHierarchy(type, parentMenuId);

    const finalParentId = parentMenuId ?? ROOT_PARENT_ID;

    const menu = await this.prisma.menu.create({
      data: {
        name,
        type,
        permissionCode: permissionCode ?? null,
        path,
        icon: icon ?? null,
        hidden: hidden ?? false,
        sort: sort ?? 0,
        status: status ?? 'enabled',
        parentMenuId: finalParentId,
        createdById: currentUserId,
      },
    });

    return plainToInstance(MenuResponseDto, menu, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(query: QueryMenuDto): Promise<PaginationData<MenuResponseDto>> {
    const {
      name,
      path,
      type,
      status,
      parentMenuId,
      createdAtStart,
      createdAtEnd,
    } = query;
    const where: Record<string, unknown> = this.buildWhere({
      contains: { name, path },
      equals: { type, status, parentMenuId },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });

    const state = this.getPaginationState(query);
    const [items, total] = await Promise.all([
      this.prisma.menu.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: state.skip,
        take: state.take,
      }),
      this.prisma.menu.count({ where }),
    ]);
    const transformed = plainToInstance(MenuResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: state.page,
      pageSize: state.pageSize,
    };
  }

  async findOne(id: string): Promise<MenuResponseDto> {
    let menu: MenuModel | null = null;

    menu = await this.prisma.menu.findUnique({
      where: { menuId: id },
    });

    if (!menu && !isNaN(Number(id))) {
      menu = await this.prisma.menu.findUnique({
        where: { id: Number(id) },
      });
    }

    if (!menu) {
      throw new NotFoundException(`菜单ID ${id} 不存在`);
    }

    return plainToInstance(MenuResponseDto, menu, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateMenuDto: UpdateMenuDto,
    currentUserId?: string,
  ): Promise<MenuResponseDto> {
    const {
      name,
      type,
      permissionCode,
      path,
      icon,
      hidden,
      sort,
      status,
      parentMenuId,
    } = updateMenuDto;

    let menu: MenuModel | null = null;

    menu = await this.prisma.menu.findUnique({
      where: { menuId: id },
    });

    if (!menu && !isNaN(Number(id))) {
      menu = await this.prisma.menu.findUnique({
        where: { id: Number(id) },
      });
    }

    if (!menu) {
      throw new NotFoundException(`菜单ID ${id} 不存在`);
    }

    if (path && path !== menu.path) {
      const existing = await this.prisma.menu.findUnique({
        where: { path },
      });
      if (existing) {
        throw new ConflictException(`菜单路径 "${path}" 已存在`);
      }
    }

    if (type && type !== menu.type) {
      throw new ConflictException('菜单类型创建后不可修改');
    }

    const currentParentId = menu.parentMenuId;
    if (parentMenuId && parentMenuId !== currentParentId) {
      await this.validateMenuHierarchy(menu.type, parentMenuId);
    }

    const updatedMenu = await this.prisma.menu.update({
      where: { id: menu.id },
      data: {
        name,
        permissionCode:
          permissionCode !== undefined ? (permissionCode ?? null) : undefined,
        path: path !== undefined ? path : undefined,
        icon: icon !== undefined ? (icon ?? null) : undefined,
        hidden,
        sort,
        status,
        parentMenuId: parentMenuId ?? currentParentId ?? ROOT_PARENT_ID,
        updatedById: currentUserId,
      },
    });

    return plainToInstance(MenuResponseDto, updatedMenu, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    let menu: MenuModel | null = null;

    menu = await this.prisma.menu.findUnique({
      where: { menuId: id },
    });

    if (!menu && !isNaN(Number(id))) {
      menu = await this.prisma.menu.findUnique({
        where: { id: Number(id) },
      });
    }

    if (!menu) {
      throw new NotFoundException(`菜单ID ${id} 不存在`);
    }

    await this.cascadeRemove(menu.menuId);
  }

  private async cascadeRemove(menuId: string): Promise<void> {
    const allIds: string[] = [];
    const collect = async (pid: string) => {
      allIds.push(pid);
      const children = await this.prisma.menu.findMany({
        where: { parentMenuId: pid },
        select: { menuId: true },
      });
      for (const child of children) {
        await collect(child.menuId);
      }
    };
    await collect(menuId);

    for (let i = allIds.length - 1; i >= 0; i--) {
      await this.prisma.menu.delete({
        where: { menuId: allIds[i] },
      });
    }
  }

  async getMenuTree(queryDto?: QueryMenuDto): Promise<MenuTreeNodeDto[]> {
    const where: Record<string, unknown> = {};
    if (queryDto?.name) where['name'] = { contains: queryDto.name };
    if (queryDto?.path) where['path'] = { contains: queryDto.path };
    if (queryDto?.type) where['type'] = queryDto.type;
    if (queryDto?.status) where['status'] = queryDto.status;
    if (queryDto?.parentMenuId) where['parentMenuId'] = queryDto.parentMenuId;

    const menus = await this.prisma.menu.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });

    type TreeNode = {
      menuId: string;
      name: string;
      type: string;
      permissionCode: string | null;
      path: string | null;
      icon: string | null;
      hidden: boolean;
      sort: number;
      status: string;
      parentMenuId: string | null;
      createdAt: Date;
      updatedAt: Date;
      children?: TreeNode[];
    };

    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    menus.forEach((m) => {
      map.set(m.menuId, {
        menuId: m.menuId,
        name: m.name,
        type: m.type,
        permissionCode: m.permissionCode,
        path: m.path,
        icon: m.icon,
        hidden: m.hidden,
        sort: m.sort,
        status: m.status,
        parentMenuId: m.parentMenuId,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        children: [],
      });
    });

    menus.forEach((m) => {
      const node = map.get(m.menuId);
      if (!node) return;
      const parentId = m.parentMenuId;
      if (parentId && parentId !== ROOT_PARENT_ID) {
        const parent = map.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    const sortChildren = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.sort !== b.sort) return a.sort - b.sort;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          sortChildren(n.children);
        } else {
          delete n.children;
        }
      });
    };

    sortChildren(roots);

    return plainToInstance(MenuTreeNodeDto, roots, {
      excludeExtraneousValues: true,
    });
  }

  async getOptions(): Promise<{ menuId: string; name: string }[]> {
    return this.prisma.menu.findMany({
      where: { status: 'enabled' },
      select: { menuId: true, name: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
  }
}
