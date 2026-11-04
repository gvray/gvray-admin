import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toDto } from '@/shared/utils/transform.util';
import { CommonStatus } from '@/shared/constants/common-status.constant';
import { OPTIONS_MAX_LIMIT } from '@/shared/constants/options.constant';
import { PrismaService } from '@/prisma/prisma.service';
import type { Department } from '@prisma/client';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';
import { Prisma } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';

/** 部门详情统一 include（create/update 返回用）；改字段只改这里。 */
const DEPARTMENT_DETAIL_INCLUDE = {
  parent: true,
  children: true,
} satisfies Prisma.DepartmentInclude;

@Injectable()
export class DepartmentsService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {
    super(prisma, configService);
  }

  async create(
    createDepartmentDto: CreateDepartmentDto,
    currentUserId?: string,
  ): Promise<DepartmentResponseDto> {
    // 检查名称是否已存在
    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        name: createDepartmentDto.name,
      },
    });

    if (existingDepartment) {
      throw new ConflictException('部门名称已存在');
    }

    // 如果有父部门，检查父部门是否存在
    if (createDepartmentDto.parentId) {
      const parentDepartment = await this.prisma.department.findUnique({
        where: { departmentId: createDepartmentDto.parentId },
      });
      if (!parentDepartment) {
        throw new NotFoundException('父部门不存在');
      }
    }

    const { parentId, ...departmentData } = createDepartmentDto;
    let parentIdFinal: string | null = null;
    if (parentId) {
      const parent = await this.prisma.department.findUnique({
        where: { departmentId: parentId },
      });
      if (!parent) {
        throw new NotFoundException('父部门不存在');
      }
      parentIdFinal = parent.departmentId;
    } else {
      parentIdFinal = null;
    }
    const department = await this.prisma.department.create({
      data: {
        ...departmentData,
        parentId: parentIdFinal,
        createdById: currentUserId,
      },
      include: DEPARTMENT_DETAIL_INCLUDE,
    });

    return toDto(DepartmentResponseDto, department);
  }

  async findAll(
    query: QueryDepartmentDto,
  ): Promise<PaginationData<DepartmentResponseDto>> {
    const { name, status, parentId, createdAtStart, createdAtEnd } = query;
    const where = this.buildWhere({
      contains: { name },
      equals: { status, parentId },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    return this.paginateWith(
      this.prisma.department,
      query,
      {
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        include: { _count: { select: { users: true } } },
      },
      DepartmentResponseDto,
    );
  }

  async findOne(departmentId: string): Promise<DepartmentResponseDto> {
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
      include: {
        parent: true,
        children: true,
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
            userPositions: {
              include: {
                position: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    return toDto(DepartmentResponseDto, department);
  }

  async update(
    departmentId: string,
    updateDepartmentDto: UpdateDepartmentDto,
    currentUserId?: string,
  ): Promise<DepartmentResponseDto> {
    // 检查部门是否存在
    const existingDepartment = await this.prisma.department.findUnique({
      where: { departmentId },
    });

    if (!existingDepartment) {
      throw new NotFoundException('部门不存在');
    }

    // 检查名称是否与其他部门冲突
    if (updateDepartmentDto.name) {
      const conflictDepartment = await this.prisma.department.findFirst({
        where: {
          name: updateDepartmentDto.name,
          NOT: { departmentId },
        },
      });

      if (conflictDepartment) {
        throw new ConflictException('部门名称已存在');
      }
    }

    // 处理父部门ID
    let finalParentId: string | null;
    if (updateDepartmentDto.parentId === null) {
      // 设置为顶级部门
      finalParentId = null;
    } else if (updateDepartmentDto.parentId) {
      // 检查父部门是否存在
      const parentDepartment = await this.prisma.department.findUnique({
        where: { departmentId: updateDepartmentDto.parentId },
      });

      if (!parentDepartment) {
        throw new NotFoundException('父部门不存在');
      }

      // 检查是否形成循环引用
      const isCircular = await this.checkCircularReference(
        departmentId,
        updateDepartmentDto.parentId,
      );
      if (isCircular) {
        throw new ConflictException('不能形成循环引用');
      }

      finalParentId = updateDepartmentDto.parentId;
    } else {
      // 没有更新父部门，保持原值
      finalParentId = existingDepartment.parentId;
    }

    const updateData = { ...updateDepartmentDto };
    delete updateData.parentId;

    const department = await this.prisma.department.update({
      where: { departmentId },
      data: {
        ...updateData,
        parentId: finalParentId,
        updatedById: currentUserId,
      },
      include: DEPARTMENT_DETAIL_INCLUDE,
    });

    return toDto(DepartmentResponseDto, department);
  }

  async remove(departmentId: string): Promise<void> {
    // 检查部门是否存在
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
      include: {
        children: true,
        users: true,
      },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    // 检查是否有子部门
    if (department.children && department.children.length > 0) {
      throw new ConflictException('该部门下还有子部门，无法删除');
    }

    // 检查是否有用户
    if (department.users && department.users.length > 0) {
      throw new ConflictException('该部门下还有用户，无法删除');
    }

    await this.prisma.department.delete({
      where: { departmentId },
    });
  }

  async removeMany(ids: string[]): Promise<void> {
    const deps = await this.prisma.department.findMany({
      where: { departmentId: { in: ids } },
      include: { children: true, users: true },
    });
    const blocked = deps.filter(
      (d) => (d.children?.length ?? 0) > 0 || (d.users?.length ?? 0) > 0,
    );
    if (blocked.length > 0) {
      throw new ConflictException('存在子部门或用户，无法批量删除');
    }
    await this.prisma.department.deleteMany({
      where: { departmentId: { in: ids } },
    });
  }

  async getTree(
    queryDto?: QueryDepartmentDto,
  ): Promise<DepartmentResponseDto[]> {
    type DeptMinimal = { departmentId: string; parentId: string };
    let allDepartments: Department[] = [];

    // 检查是否有搜索条件
    const hasSearchConditions =
      queryDto?.name ||
      queryDto?.status !== undefined ||
      queryDto?.parentId ||
      queryDto?.createdAtStart !== undefined ||
      queryDto?.createdAtEnd !== undefined;

    if (hasSearchConditions) {
      // 有搜索条件时，先找到匹配的部门，然后获取对应的父级路径
      const whereConditions: Prisma.DepartmentWhereInput = {};

      // 处理状态过滤
      if (queryDto?.status !== undefined) {
        whereConditions.status = queryDto.status;
      }

      // 处理名称搜索
      if (queryDto?.name) {
        let processedName = queryDto.name;
        try {
          processedName = decodeURIComponent(queryDto.name);
        } catch {
          processedName = queryDto.name;
        }

        whereConditions.name = { contains: processedName };
      }

      // 处理父部门ID过滤
      if (queryDto?.parentId !== undefined) {
        whereConditions.parentId = queryDto.parentId;
      }
      if (queryDto?.createdAtStart || queryDto?.createdAtEnd) {
        const tzSuffix = this.configService.get<string>(
          'app.tzSuffix',
          '+08:00',
        );
        const o: { gte?: Date; lte?: Date } = {};
        if (queryDto.createdAtStart)
          o.gte = startOfDay(queryDto.createdAtStart, tzSuffix);
        if (queryDto.createdAtEnd)
          o.lte = endOfDay(queryDto.createdAtEnd, tzSuffix);
        whereConditions.createdAt = o;
      }

      // 找到匹配的部门
      const matchedDepartmentsRaw = await this.prisma.department.findMany({
        where: whereConditions,
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        select: { departmentId: true, parentId: true },
      });

      if (matchedDepartmentsRaw.length > 0) {
        // 一次性拉全量部门到内存，避免逐级 findUnique 的 N+1
        const allMinimal = await this.prisma.department.findMany({
          select: { departmentId: true, parentId: true },
        });
        const parentMap = new Map(
          allMinimal.map((d) => [d.departmentId, d.parentId]),
        );

        // 收集匹配部门 + 所有祖先
        const departmentIdsToInclude = new Set<string>();
        for (const dept of matchedDepartmentsRaw) {
          departmentIdsToInclude.add(dept.departmentId);
          let pid = dept.parentId;
          while (pid && !departmentIdsToInclude.has(pid)) {
            departmentIdsToInclude.add(pid);
            pid = parentMap.get(pid) ?? null;
          }
        }

        // 获取所有需要包含的部门
        allDepartments = await this.prisma.department.findMany({
          where: {
            departmentId: { in: Array.from(departmentIdsToInclude) },
            ...(queryDto?.status !== undefined && { status: queryDto.status }),
          },
          orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        });
      }
    } else {
      // 没有搜索条件时，获取所有部门
      allDepartments = await this.prisma.department.findMany({
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      });
    }

    // 构建完整的树形结构
    interface DepartmentNode extends Department {
      children: DepartmentNode[];
    }

    const departmentMap = new Map<string, DepartmentNode>();
    const rootDepartments: DepartmentNode[] = [];

    // 首先创建所有部门的映射
    allDepartments.forEach((dept) => {
      departmentMap.set(dept.departmentId, {
        ...dept,
        children: [],
      });
    });

    // 构建父子关系
    allDepartments.forEach((dept) => {
      const departmentNode = departmentMap.get(dept.departmentId);

      if (dept.parentId) {
        const parentNode = departmentMap.get(dept.parentId);
        if (parentNode && departmentNode) {
          parentNode.children.push(departmentNode);
        } else if (departmentNode) {
          // 如果父节点不在当前结果中，将其作为根节点
          rootDepartments.push(departmentNode);
        }
      } else if (departmentNode) {
        rootDepartments.push(departmentNode);
      }
    });
    // 递归转换嵌套对象为 DTO 格式
    const convertToDto = (nodes: DepartmentNode[]): DepartmentResponseDto[] => {
      return nodes.map((node) => {
        const dto = toDto(DepartmentResponseDto, node);

        if (node.children && node.children.length > 0) {
          dto.children = convertToDto(node.children);
        }

        return dto;
      });
    };

    return convertToDto(rootDepartments);
  }

  /**
   * 检查将 parentId 挂到 departmentId 下是否会形成循环引用。
   * 一次性拉全量 parentId 映射到内存遍历，避免逐级 findUnique 的 N+1。
   */
  private async checkCircularReference(
    departmentId: string,
    parentId: string,
  ): Promise<boolean> {
    const all = await this.prisma.department.findMany({
      select: { departmentId: true, parentId: true },
    });
    const parentMap = new Map(
      all.map((d) => [d.departmentId, d.parentId]),
    );

    let currentParentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) return true;
      if (currentParentId === departmentId) return true;
      visited.add(currentParentId);
      currentParentId = parentMap.get(currentParentId) ?? null;
    }

    return false;
  }

  async getOptions(): Promise<
    {
      departmentId: string;
      name: string;
      parentId: string | null;
      sort: number;
    }[]
  > {
    return this.prisma.department.findMany({
      where: { status: CommonStatus.ENABLED },
      select: {
        departmentId: true,
        name: true,
        parentId: true,
        sort: true,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      take: OPTIONS_MAX_LIMIT,
    });
  }
}
