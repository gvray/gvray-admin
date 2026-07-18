import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import type { Permission as PermissionModel } from '@prisma/client';

@Injectable()
export class PermissionsService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {
    super(prisma, configService);
  }

  async findAll(
    query: QueryPermissionDto,
  ): Promise<PaginationData<PermissionResponseDto>> {
    const { name, code, createdAtStart, createdAtEnd } = query;
    const where: Record<string, unknown> = this.buildWhere({
      contains: { name, code },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    // 排除已软删除的记录
    where['deletedAt'] = null;
    const state = this.getPaginationState(query);
    const [items, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: state.skip,
        take: state.take,
      }),
      this.prisma.permission.count({ where }),
    ]);
    const transformed = plainToInstance(PermissionResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: state.page,
      pageSize: state.pageSize,
    };
  }

  async findAllFlat(
    mine = false,
    userId?: string,
  ): Promise<PermissionResponseDto[]> {
    if (mine && userId) {
      const user = await this.prisma.user.findUnique({
        where: { userId },
        select: {
          userRoles: {
            select: {
              role: {
                select: {
                  rolePermissions: {
                    select: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const permMap = new Map<string, PermissionModel>();
      for (const ur of user?.userRoles ?? []) {
        for (const rp of ur.role.rolePermissions) {
          permMap.set(rp.permission.permissionId, rp.permission);
        }
      }
      const items = Array.from(permMap.values());
      return plainToInstance(PermissionResponseDto, items, {
        excludeExtraneousValues: true,
      });
    }

    const items = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ code: 'asc' }],
    });
    return plainToInstance(PermissionResponseDto, items, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    let permission: PermissionModel | null = null;

    permission = await this.prisma.permission.findUnique({
      where: { permissionId: id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission && !isNaN(Number(id))) {
      permission = await this.prisma.permission.findUnique({
        where: { id: Number(id) },
        include: {
          rolePermissions: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    currentUserId?: string,
  ): Promise<PermissionResponseDto> {
    const { name, description } = updatePermissionDto;

    let permission: PermissionModel | null = null;

    permission = await this.prisma.permission.findUnique({
      where: { permissionId: id },
    });

    if (!permission && !isNaN(Number(id))) {
      permission = await this.prisma.permission.findUnique({
        where: { id: Number(id) },
      });
    }

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    if (permission.origin !== 'SYSTEM') {
      throw new ConflictException('权限必须由扫描同步生成，不允许手动修改');
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id: permission.id },
      data: {
        name,
        description,
        updatedById: currentUserId,
      },
    });

    return plainToInstance(PermissionResponseDto, updatedPermission, {
      excludeExtraneousValues: true,
    });
  }
}
