import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toDto } from '@/shared/utils/transform.util';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PasswordService } from '@/shared/services/password.service';
import { AuthCacheService } from '@/shared/services/auth-cache.service';
import { DataScopeService } from '@/modules/system/roles/services/data-scope.service';
import { QueryUserDto } from './dto/query-user.dto';
import { Prisma } from '@prisma/client';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { UserStatus } from '@/shared/constants/user-status.constant';

import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';
import { PermissionCacheService } from '@/redis/permission-cache.service';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';

/** 用户详情统一 select，消除 7 处重复；改字段只改这里。 */
const USER_DETAIL_SELECT = {
  userId: true,
  email: true,
  username: true,
  nickname: true,
  phone: true,
  avatar: true,
  gender: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: { role: { select: { roleId: true, name: true } } },
  },
  department: { select: { departmentId: true, name: true } },
  userPositions: {
    select: { position: { select: { positionId: true, name: true } } },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
    private readonly permissionCache: PermissionCacheService,
    private readonly passwordService: PasswordService,
    private readonly authCache: AuthCacheService,
    private readonly dataScopeService: DataScopeService,
  ) {
    super(prisma, configService);
  }

  /**
   * 层级保护：非超级管理员不能操作超级管理员
   * @param targetUserId 目标用户ID
   * @param currentUserId 当前操作用户ID
   * @param action 操作描述（用于异常消息）
   */
  private async checkSuperAdminHierarchy(
    targetUserId: string,
    currentUserId?: string,
    action = '操作',
  ): Promise<void> {
    if (
      currentUserId &&
      (await this.isSuperAdmin(targetUserId)) &&
      currentUserId !== targetUserId
    ) {
      throw new ForbiddenException(`无权${action}超级管理员`);
    }
  }

  /**
   * 检查角色ID列表中是否包含超级管理员角色
   * @param roleIds 角色ID列表
   * @returns 是否包含超级管理员角色
   */
  private async containsSuperAdminRole(roleIds: string[]): Promise<boolean> {
    if (!roleIds || roleIds.length === 0) {
      return false;
    }

    const roles = await this.prisma.role.findMany({
      where: { roleId: { in: roleIds } },
      select: { roleKey: true },
    });

    return roles.some((role) => role.roleKey === SUPER_ROLE_KEY);
  }

  /**
   * 将数据权限范围合并进查询条件（读取列表/详情用）。
   * 超级管理员不限制；其余按角色 dataScope 收窄到 本人 / 本部门 / 本部门及以下 / 自定义。
   */
  private async applyDataScope(
    where: Prisma.UserWhereInput,
    currentUserId?: string,
  ): Promise<Prisma.UserWhereInput> {
    if (!currentUserId || (await this.isSuperAdmin(currentUserId))) {
      return where;
    }
    const scopeWhere = (await this.dataScopeService.buildDataScopeQuery(
      currentUserId,
    )) as Prisma.UserWhereInput;
    if (Object.keys(scopeWhere).length === 0) return where;
    // 用 AND 包裹，避免 where 与 scopeWhere 同字段（如 userId）时展开覆盖导致条件丢失
    return { AND: [where, scopeWhere] };
  }

  /**
   * 写操作前断言目标用户在当前用户的数据权限范围内（越权防护）。
   */
  private async assertWithinDataScope(
    targetUserId: string,
    currentUserId?: string,
  ): Promise<void> {
    if (!currentUserId || (await this.isSuperAdmin(currentUserId))) return;
    const scopeWhere = (await this.dataScopeService.buildDataScopeQuery(
      currentUserId,
    )) as Prisma.UserWhereInput;
    if (Object.keys(scopeWhere).length === 0) return;
    // 用 AND 包裹：scopeWhere 可能含 userId（SELF），与 targetUserId 的 userId 同键，
    // 直接展开会让后者覆盖前者，使越权检查恒为真（count 命中当前用户自己）。
    const inScope = await this.prisma.user.count({
      where: { AND: [{ userId: targetUserId }, scopeWhere] },
    });
    if (inScope === 0) {
      throw new ForbiddenException('无权操作超出数据权限范围的用户');
    }
  }

  private async validateRoleIds(roleIds: string[]): Promise<void> {
    if (!roleIds || roleIds.length === 0) {
      return;
    }

    const count = await this.prisma.role.count({
      where: { roleId: { in: roleIds } },
    });
    if (count !== new Set(roleIds).size) {
      throw new NotFoundException('部分角色不存在');
    }
  }

  async create(
    createUserDto: CreateUserDto,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const { password, departmentId, positionIds, ...rest } = createUserDto;

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (rest.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: rest.email },
      });
      if (existingUser) {
        throw new ConflictException('邮箱已被注册');
      }
    }

    // 检查用户名是否已存在
    if (rest.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: rest.username },
      });
      if (existingUser) {
        throw new ConflictException('用户名已被注册');
      }
    }

    const hashedPassword = await this.passwordService.hash(password);

    // 验证部门是否存在
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { departmentId: departmentId },
      });
      if (!department) {
        throw new NotFoundException('部门不存在');
      }
    }

    // 验证岗位是否存在
    if (positionIds && positionIds.length > 0) {
      const positions = await this.prisma.position.findMany({
        where: { positionId: { in: positionIds } },
      });
      if (positions.length !== positionIds.length) {
        throw new NotFoundException('部分岗位不存在');
      }
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          ...rest,
          password: hashedPassword,
          department: departmentId
            ? { connect: { departmentId } }
            : undefined,
          status: rest.status ?? UserStatus.ENABLED,
          createdBy: currentUserId
            ? { connect: { userId: currentUserId } }
            : undefined,
        },
        select: { userId: true },
      });

      if (positionIds && positionIds.length > 0) {
        await tx.userPosition.createMany({
          data: positionIds.map((positionId) => ({
            userId: created.userId,
            positionId,
            createdById: currentUserId,
          })),
        });
      }

      await tx.userSettings.create({
        data: {
          userId: created.userId,
          settings: {
            theme: 'light',
            language: 'zh-CN',
            sidebarCollapsed: false,
            pageSize: 10,
            timezone: 'Asia/Shanghai',
            showWatermark: true,
            enableNotification: true,
            colorScheme: 'default',
          },
        },
      });

      return created;
    });

    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: USER_DETAIL_SELECT,
    });

    return toDto(UserResponseDto, userWithRelations);
  }

  async findAll(
    query: QueryUserDto = new QueryUserDto(),
    currentUserId?: string,
  ): Promise<PaginationData<UserResponseDto>> {
    // 构建查询条件
    const where: Prisma.UserWhereInput = {};

    if (query?.keyword) {
      where.OR = [
        { username: { contains: query.keyword } },
        { nickname: { contains: query.keyword } },
        { phone: { contains: query.keyword } },
        { email: { contains: query.keyword } },
      ];
    }

    if (query?.username) {
      where.username = {
        contains: query.username,
      };
    }

    if (query?.nickname) {
      where.nickname = {
        contains: query.nickname,
      };
    }

    if (query?.phone) {
      where.phone = {
        contains: query.phone,
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

    const scopedWhere = await this.applyDataScope(where, currentUserId);

    return this.paginateWith(
      this.prisma.user,
      query,
      {
        where: scopedWhere,
        orderBy: [{ createdAt: 'desc' }],
        select: USER_DETAIL_SELECT,
      },
      UserResponseDto,
    );
  }

  async findOne(
    userId: string,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    await this.assertWithinDataScope(userId, currentUserId);

    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: USER_DETAIL_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    return toDto(UserResponseDto, user);
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const { departmentId, positionIds, ...rest } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (
      userId === currentUserId &&
      updateUserDto.status === UserStatus.DISABLED
    ) {
      throw new ForbiddenException('不能禁用自己账号');
    }

    // 不能禁用导致活跃超级管理员少于 2 个
    if (
      updateUserDto.status === UserStatus.DISABLED &&
      (await this.isSuperAdmin(userId))
    ) {
      const activeSuperAdminCount = await this.prisma.user.count({
        where: {
          status: UserStatus.ENABLED,
          userRoles: {
            some: {
              role: {
                roleKey: SUPER_ROLE_KEY,
              },
            },
          },
        },
      });
      if (activeSuperAdminCount <= 2) {
        throw new ForbiddenException('不能禁用导致活跃超级管理员少于 2 个');
      }
    }

    await this.checkSuperAdminHierarchy(userId, currentUserId, '修改');
    await this.assertWithinDataScope(userId, currentUserId);

    // 验证部门是否存在
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { departmentId: departmentId },
      });
      if (!department) {
        throw new NotFoundException('部门不存在');
      }
    }

    // 验证岗位是否存在
    if (positionIds && positionIds.length > 0) {
      const positions = await this.prisma.position.findMany({
        where: { positionId: { in: positionIds } },
      });
      if (positions.length !== positionIds.length) {
        throw new NotFoundException('部分岗位不存在');
      }
    }

    // 先删后建必须原子，避免残留半成品关联
    await this.prisma.$transaction(async (tx) => {
      if (positionIds !== undefined) {
        await tx.userPosition.deleteMany({
          where: { userId: user.userId },
        });
      }

      await tx.user.update({
        where: { userId: user.userId },
        data: {
          ...rest,
          department: departmentId
            ? { connect: { departmentId } }
            : undefined,
          updatedBy: currentUserId
            ? { connect: { userId: currentUserId } }
            : undefined,
        },
      });

      if (positionIds && positionIds.length > 0) {
        await tx.userPosition.createMany({
          data: positionIds.map((positionId) => ({
            userId: user.userId,
            positionId,
            createdById: currentUserId,
          })),
        });
      }
    });

    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: USER_DETAIL_SELECT,
    });

    await this.authCache.invalidateUser(userId);
    if (rest.status !== undefined) {
      await this.permissionCache.del(userId);
    }

    return toDto(UserResponseDto, userWithRelations);
  }

  async resetPassword(
    userId: string,
    newPassword: string,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 超级管理员密码只能由本人重置
    if (
      currentUserId &&
      (await this.isSuperAdmin(userId)) &&
      currentUserId !== userId
    ) {
      throw new ForbiddenException('超级管理员密码只能由本人重置');
    }

    await this.assertWithinDataScope(userId, currentUserId);

    const hashedPassword = await this.passwordService.hash(newPassword);

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        password: hashedPassword,
        updatedBy: currentUserId
          ? { connect: { userId: currentUserId } }
          : undefined,
      },
    });

    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: USER_DETAIL_SELECT,
    });

    return toDto(UserResponseDto, userWithRelations);
  }

  async remove(userId: string, currentUserId?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (userId === currentUserId) {
      throw new ForbiddenException('不能删除自己账号');
    }

    await this.checkSuperAdminHierarchy(userId, currentUserId, '删除');
    await this.assertWithinDataScope(userId, currentUserId);

    if (
      (await this.isSuperAdmin(userId)) &&
      (await this.countSuperAdminUsers()) <= 2
    ) {
      throw new ForbiddenException('不能删除导致超级管理员少于 2 个');
    }

    await this.authCache.invalidateUserAll(userId);
    await this.prisma.user.delete({
      where: { userId: user.userId },
    });
    return;
  }

  // 为用户分配角色
  async assignRoles(
    userId: string,
    roleIds: string[],
    currentUserId: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (userId === currentUserId) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    await this.checkSuperAdminHierarchy(userId, currentUserId, '修改角色');
    await this.assertWithinDataScope(userId, currentUserId);

    await this.validateRoleIds(roleIds);

    const containsSuperRole = await this.containsSuperAdminRole(roleIds);

    // 非超管不能把任何人提升为超管
    if (containsSuperRole && !(await this.isSuperAdmin(currentUserId))) {
      throw new ForbiddenException('无权分配超级管理员角色');
    }

    const targetIsSuperAdmin = await this.isSuperAdmin(userId);
    if (
      targetIsSuperAdmin &&
      !containsSuperRole &&
      (await this.countSuperAdminUsers()) <= 2
    ) {
      throw new ForbiddenException('至少保留 2 个超级管理员');
    }

    // 先删后建必须原子
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId: user.userId },
      });

      if (roleIds && roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: user.userId,
            roleId,
            createdById: currentUserId,
          })),
        });
      }

      await tx.user.update({
        where: { userId: user.userId },
        data: { updatedById: currentUserId },
      });
    });

    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: USER_DETAIL_SELECT,
    });

    await this.authCache.invalidateUserAll(userId);

    return toDto(UserResponseDto, userWithRelations);
  }

  // 移除用户的角色
  async removeRoles(
    userId: string,
    roleIds: string[],
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (userId === currentUserId) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    await this.checkSuperAdminHierarchy(userId, currentUserId, '修改角色');
    await this.assertWithinDataScope(userId, currentUserId);

    await this.validateRoleIds(roleIds);

    const removesSuperRole = await this.containsSuperAdminRole(roleIds);
    if (
      removesSuperRole &&
      (await this.isSuperAdmin(userId)) &&
      (await this.countSuperAdminUsers()) <= 2
    ) {
      throw new ForbiddenException('至少保留 2 个超级管理员');
    }

    await this.prisma.$transaction(async (tx) => {
      if (roleIds && roleIds.length > 0) {
        await tx.userRole.deleteMany({
          where: {
            userId: user.userId,
            roleId: { in: roleIds },
          },
        });
      }

      await tx.user.update({
        where: { userId: user.userId },
        data: { updatedById: currentUserId },
      });
    });

    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: USER_DETAIL_SELECT,
    });

    await this.authCache.invalidateUserAll(userId);

    return toDto(UserResponseDto, userWithRelations);
  }

  async removeMany(ids: string[], currentUserId?: string): Promise<void> {
    if (currentUserId && ids.includes(currentUserId)) {
      throw new ForbiddenException('不能删除自己账号');
    }

    // 一次性带出角色，避免逐个 isSuperAdmin 的 N+1 查询
    const users = await this.prisma.user.findMany({
      where: { userId: { in: ids } },
      select: {
        userId: true,
        userRoles: { select: { role: { select: { roleKey: true } } } },
      },
    });
    const isSuper = (u: (typeof users)[number]) =>
      u.userRoles.some((ur) => ur.role.roleKey === SUPER_ROLE_KEY);

    let deletingSuperAdminCount = 0;
    for (const u of users) {
      if (isSuper(u)) {
        deletingSuperAdminCount++;
        await this.checkSuperAdminHierarchy(u.userId, currentUserId, '删除');
      }
    }
    if (
      deletingSuperAdminCount > 0 &&
      (await this.countSuperAdminUsers()) - deletingSuperAdminCount < 2
    ) {
      throw new ForbiddenException('至少保留 2 个超级管理员');
    }

    for (const u of users) {
      await this.authCache.invalidateUserAll(u.userId);
    }
    await this.prisma.user.deleteMany({
      where: { userId: { in: ids } },
    });
  }
}
