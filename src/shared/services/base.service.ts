import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClassConstructor } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDay, endOfDay } from '../utils/time.util';
import { toDtoList } from '../utils/transform.util';
import { PaginationDto } from '../dtos/pagination.dto';
import { PaginationData } from '../interfaces/response.interface';
import { SUPER_ROLE_KEY } from '../constants/role.constant';

/**
 * 基础服务类
 * 提供通用的CRUD操作和分页查询方法
 */
@Injectable()
export abstract class BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {}

  protected async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userRoles: {
          select: { role: { select: { roleKey: true } } },
        },
      },
    });
    return !!user?.userRoles.some((ur) => ur.role.roleKey === SUPER_ROLE_KEY);
  }

  /**
   * 统计超级管理员数量（用于“至少保留 N 个超管”保护规则）。
   * 集中在此处，避免 UsersService / RolesService 各写一份导致规则漂移。
   */
  protected async countSuperAdminUsers(): Promise<number> {
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

  protected buildWhere(params: {
    contains?: Record<string, string | undefined>;
    equals?: Record<string, unknown>;
    boolean?: { field: string; value?: string };
    date?: {
      field: string;
      start?: string;
      end?: string;
    };
  }): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (params.contains) {
      for (const [key, val] of Object.entries(params.contains)) {
        if (val !== undefined && val !== '') {
          where[key] = { contains: val };
        }
      }
    }
    if (params.equals) {
      for (const [key, val] of Object.entries(params.equals)) {
        if (val !== undefined && val !== null) {
          where[key] = val;
        }
      }
    }
    const b = params.boolean;
    if (b?.value !== undefined && b.value !== '') {
      where[b.field] = b.value === 'true' || b.value === '1';
    }
    const d = params.date;
    if (d) {
      if (d.start || d.end) {
        const tzSuffix = this.configService.get<string>(
          'app.tzSuffix',
          '+08:00',
        );
        const o: Record<string, Date> = {};
        if (d.start) o.gte = startOfDay(d.start, tzSuffix);
        if (d.end) o.lte = endOfDay(d.end, tzSuffix);
        where[d.field] = o;
      }
    }
    return where;
  }

  protected getPaginationState(pagination: PaginationDto): {
    skip: number;
    take: number;
    page: number;
    pageSize: number;
  } {
    const skip = pagination.getSkip();
    const take = pagination.getTake();
    return {
      skip,
      take,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  /**
   * 分页查询样板：getPaginationState + Promise.all(findMany, count) + plainToInstance + 组装返回。
   * model 的 where/orderBy/select/include 由调用方按各自 Prisma 类型构造，
   * 这里只统一分页与 DTO 转换，避免 11 处重复同样的 ~12 行。
   */
  protected async paginateWith<D>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: { findMany: (args: any) => Promise<any[]>; count: (args: any) => Promise<number> },
    query: PaginationDto,
    args: { where: unknown; orderBy: unknown; select?: unknown; include?: unknown },
    Dto: ClassConstructor<D>,
  ): Promise<PaginationData<D>> {
    const state = this.getPaginationState(query);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findManyArgs: Record<string, any> = {
      where: args.where,
      orderBy: args.orderBy,
      skip: state.skip,
      take: state.take,
    };
    if (args.select !== undefined) findManyArgs.select = args.select;
    if (args.include !== undefined) findManyArgs.include = args.include;
    const [items, total] = await Promise.all([
      model.findMany(findManyArgs),
      model.count({ where: args.where }),
    ]);
    return {
      items: toDtoList(Dto, items),
      total,
      page: state.page,
      pageSize: state.pageSize,
    };
  }
}
