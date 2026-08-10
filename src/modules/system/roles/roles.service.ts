import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommonStatus } from '@/shared/constants/common-status.constant';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { DataScopeService } from './services/data-scope.service';
import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';
import { PermissionCacheService } from '@/redis/permission-cache.service';

@Injectable()
export class RolesService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
    private readonly permissionCache: PermissionCacheService,
    private readonly dataScopeService: DataScopeService,
  ) {
    super(prisma, configService);
  }

  private async countSuperAdminUsers(): Promise<number> {
    return this.prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: {
              roleKey: SUPER_ROLE_KEY,
            },
          },
        },
      },
    });
  }

  private async validatePermissionIds(permissionIds: string[]): Promise<void> {
    if (!permissionIds || permissionIds.length === 0) {
      return;
    }

    const count = await this.prisma.permission.count({
      where: {
        permissionId: { in: permissionIds },
        origin: 'SYSTEM',
        deletedAt: null,
      },
    });
    if (count !== new Set(permissionIds).size) {
      throw new NotFoundException('部分权限不存在或不是扫描生成权限');
    }
  }

  /**
   * 获取当前用户拥有的所有权限ID
   */
  private async getCurrentUserPermissionIds(
    userId: string,
  ): Promise<Set<string>> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userRoles: {
          select: {
            role: {
              select: {
                rolePermissions: {
                  select: {
                    permission: { select: { permissionId: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) return new Set();
    const ids = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        ids.add(rp.permission.permissionId);
      }
    }
    return ids;
  }

  /**
   * 检查是否修改自己所属角色的权限
   */
  private async checkOwnRole(
    roleId: string,
    currentUserId?: string,
  ): Promise<void> {
    if (!currentUserId) return;
    const membership = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: currentUserId,
          roleId,
        },
      },
    });
    if (membership) {
      throw new ForbiddenException('不能修改自己所属角色的权限');
    }
  }

  /**
   * 检查当前用户是否有权分配这些权限
   * 超级管理员不受限制
   */
  private async validatePermissionAssignment(
    permissionIds: string[],
    currentUserId?: string,
  ): Promise<void> {
    if (!currentUserId || permissionIds.length === 0) return;
    if (await this.isSuperAdmin(currentUserId)) return;

    const allowedIds = await this.getCurrentUserPermissionIds(currentUserId);
    const invalid = permissionIds.filter((id) => !allowedIds.has(id));
    if (invalid.length > 0) {
      throw new ForbiddenException('无权分配自身未拥有的权限');
    }
  }

  async create(
    createRoleDto: CreateRoleDto,
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const { name, roleKey, description, remark, sort, status, permissionIds } =
      createRoleDto;

    await this.validatePermissionIds(permissionIds ?? []);
    await this.validatePermissionAssignment(permissionIds ?? [], currentUserId);

    // 检查是否尝试创建超级角色
    if (roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('不允许创建超级管理员角色');
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        roleKey,
        description,
        remark,
        sort: sort ?? 0,
        status: (status as string) ?? CommonStatus.ENABLED,
        createdById: currentUserId,
      },
    });

    // 如果有权限ID，创建角色权限关联
    if (permissionIds && permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.roleId,
          permissionId: permissionId.toString(),
          createdById: currentUserId,
        })),
      });
    }

    const result = await this.prisma.role.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryRoleDto = new QueryRoleDto(),
  ): Promise<PaginationData<RoleResponseDto>> {
    // 构建查询条件
    const where: Prisma.RoleWhereInput = {};

    if (query?.name) {
      where.name = {
        contains: query.name,
      };
    }

    if (query?.description) {
      where.description = {
        contains: query.description,
      };
    }

    if (query?.roleKey) {
      where.roleKey = {
        contains: query.roleKey,
      };
    }

    if (query?.status !== undefined) {
      where.status = query.status;
    }

    if (query?.createdAtStart || query?.createdAtEnd) {
      const tzSuffix = this.configService.get<string>('app.tzSuffix', '+08:00');
      where.createdAt = {};
      if (query.createdAtStart) {
        where.createdAt.gte = startOfDay(query.createdAtStart, tzSuffix);
      }
      if (query.createdAtEnd) {
        where.createdAt.lte = endOfDay(query.createdAtEnd, tzSuffix);
      }
    }

    // 基本字段选择，不包含关联数据
    const select = {
      id: true,
      roleId: true,
      roleKey: true,
      name: true,
      description: true,
      remark: true,
      sort: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    };

    const state = this.getPaginationState(query);
    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        select,
        skip: state.skip,
        take: state.take,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.role.count({ where }),
    ]);
    const transformed = plainToInstance(RoleResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: state.page,
      pageSize: state.pageSize,
    };
  }

  async findOne(roleId: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                nickname: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const { name, roleKey, description, remark, sort, status, permissionIds } =
      updateRoleDto;

    const role = await this.prisma.role.findUnique({
      where: { roleId },
      include: { userRoles: true },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    if (roleKey && roleKey !== role.roleKey) {
      throw new ForbiddenException('角色标识不可修改');
    }

    // 检查是否为超级角色，如果是则不允许修改
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许修改');
    }

    await this.checkOwnRole(roleId, currentUserId);
    await this.validatePermissionIds(permissionIds ?? []);
    await this.validatePermissionAssignment(permissionIds ?? [], currentUserId);

    // 更新角色基本信息
    await this.prisma.role.update({
      where: { roleId },
      data: {
        name,
        description,
        remark,
        sort,
        status: status,
        updatedById: currentUserId,
      },
    });

    // 如果提供了权限ID，更新角色权限关联
    if (permissionIds !== undefined) {
      // 删除现有的角色权限关联
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: role.roleId },
      });

      // 创建新的角色权限关联
      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.roleId,
            permissionId: permissionId.toString(),
            createdById: currentUserId,
          })),
        });
      }

      // 清除该角色下所有用户的权限缓存
      await this.invalidateRoleUserCache(roleId);
    }

    const result = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async remove(roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
      include: { userRoles: true },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 检查是否为超级角色，如果是则不允许删除
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许删除');
    }

    if ((role.userRoles?.length ?? 0) > 0) {
      throw new ForbiddenException('不能删除正在被使用的角色');
    }

    await this.prisma.role.delete({
      where: { roleId },
    });
  }

  async removeMany(ids: string[]): Promise<void> {
    const roles = await this.prisma.role.findMany({
      where: { roleId: { in: ids } },
      include: { userRoles: true },
    });
    const blocked = roles.filter(
      (r) => r.roleKey === SUPER_ROLE_KEY || (r.userRoles?.length ?? 0) > 0,
    );
    if (blocked.length > 0) {
      throw new ForbiddenException('存在超级角色或绑定用户，无法批量删除');
    }
    await this.prisma.role.deleteMany({
      where: { roleId: { in: ids } },
    });
  }

  // 为角色分配权限
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 检查是否为超级角色，如果是则不允许修改权限
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许修改权限');
    }

    await this.checkOwnRole(roleId, currentUserId);
    await this.validatePermissionIds(permissionIds);
    await this.validatePermissionAssignment(permissionIds, currentUserId);

    // 删除现有的角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: role.roleId },
    });

    // 创建新的角色权限关联
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.roleId,
          permissionId: permissionId,
          createdById: currentUserId,
        })),
      });
    }

    await this.prisma.role.update({
      where: { roleId: role.roleId },
      data: { updatedById: currentUserId },
    });

    const result = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // 清除该角色下所有用户的权限缓存
    await this.invalidateRoleUserCache(roleId);

    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  // 移除角色的权限
  async removePermissions(
    roleId: string,
    permissionIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 检查是否为超级角色，如果是则不允许移除权限
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许移除权限');
    }

    await this.validatePermissionIds(permissionIds);

    // 删除指定的角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: role.roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    await this.prisma.role.update({
      where: { roleId: role.roleId },
      data: { updatedById: currentUserId },
    });

    const result = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // 清除该角色下所有用户的权限缓存
    await this.invalidateRoleUserCache(roleId);

    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  private async invalidateRoleUserCache(roleId: string): Promise<void> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });
    for (const ur of userRoles) {
      await this.permissionCache.del(ur.userId);
    }
  }

  // 为角色分配用户
  async assignUsers(
    roleId: string,
    userIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    if (role.roleKey === SUPER_ROLE_KEY && userIds.length < 2) {
      throw new ForbiddenException('超级管理员角色至少保留 2 个用户');
    }

    if (currentUserId) {
      const currentMembership = await this.prisma.userRole.findUnique({
        where: { userId_roleId: { userId: currentUserId, roleId } },
      });
      const currentlyInRole = !!currentMembership;
      const willBeInRole = userIds.includes(currentUserId);
      if (currentlyInRole !== willBeInRole) {
        throw new ForbiddenException('不能修改自己的角色');
      }
    }

    // 非超级管理员不能对超级管理员角色分配用户
    if (
      currentUserId &&
      role.roleKey === SUPER_ROLE_KEY &&
      !(await this.isSuperAdmin(currentUserId))
    ) {
      throw new ForbiddenException('无权对超级管理员角色分配用户');
    }

    // 验证用户是否存在
    const users = await this.prisma.user.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException('部分用户不存在');
    }

    // 先删除该角色的所有用户关联
    await this.prisma.userRole.deleteMany({
      where: {
        roleId,
      },
    });

    // 创建新的用户角色关联
    await this.prisma.userRole.createMany({
      data: userIds.map((userId) => ({
        roleId,
        userId,
        createdById: currentUserId,
      })),
    });

    await this.prisma.role.update({
      where: { roleId },
      data: { updatedById: currentUserId },
    });

    const updatedRole = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                nickname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(RoleResponseDto, updatedRole, {
      excludeExtraneousValues: true,
    });
  }

  // 移除角色的用户
  async removeUsers(
    roleId: string,
    userIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    if (currentUserId && userIds.includes(currentUserId)) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    if (role.roleKey === SUPER_ROLE_KEY) {
      const removingCount = await this.prisma.userRole.count({
        where: {
          roleId,
          userId: { in: userIds },
        },
      });
      if ((await this.countSuperAdminUsers()) - removingCount < 2) {
        throw new ForbiddenException('至少保留 2 个超级管理员');
      }
    }

    // 非超级管理员不能对超级管理员角色移除用户
    if (
      currentUserId &&
      role.roleKey === SUPER_ROLE_KEY &&
      !(await this.isSuperAdmin(currentUserId))
    ) {
      throw new ForbiddenException('无权对超级管理员角色移除用户');
    }

    await this.prisma.userRole.deleteMany({
      where: {
        roleId,
        userId: {
          in: userIds,
        },
      },
    });

    await this.prisma.role.update({
      where: { roleId },
      data: { updatedById: currentUserId },
    });

    const updatedRole = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                nickname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(RoleResponseDto, updatedRole, {
      excludeExtraneousValues: true,
    });
  }

  // 为角色分配数据权限
  async assignDataScope(
    roleId: string,
    dataScope: number,
    departmentIds?: string[],
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    // 检查是否为超级角色，如果是则不允许修改数据权限
    if (role?.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许修改数据权限');
    }

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return this.dataScopeService.assignDataScopeToRole(
      roleId,
      dataScope,
      departmentIds,
      currentUserId,
    );
  }

  // 获取角色的数据权限
  async getRoleDataScope(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return this.dataScopeService.getRoleDataScope(roleId);
  }

  async getOptions(): Promise<
    {
      roleId: string;
      name: string;
      roleKey: string;
      sort: number;
    }[]
  > {
    return this.prisma.role.findMany({
      where: { status: CommonStatus.ENABLED },
      select: {
        roleId: true,
        name: true,
        roleKey: true,
        sort: true,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
  }
}
