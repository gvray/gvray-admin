import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { QueryRoleTemplateDto } from './dto/query-role-template.dto';
import { RoleTemplateResponseDto } from './dto/role-template-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RoleTemplatesService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {
    super(prisma, configService);
  }

  async findAll(
    query: QueryRoleTemplateDto,
  ): Promise<PaginationData<RoleTemplateResponseDto>> {
    const { name } = query;
    const where = this.buildWhere({
      contains: { name },
    });

    const state = this.getPaginationState(query);
    const [items, total] = await Promise.all([
      this.prisma.roleTemplate.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: state.skip,
        take: state.take,
      }),
      this.prisma.roleTemplate.count({ where }),
    ]);

    const transformed = items.map((item) =>
      plainToInstance(RoleTemplateResponseDto, item, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      items: transformed,
      total,
      page: state.page,
      pageSize: state.pageSize,
    };
  }

  async findOne(templateId: string): Promise<RoleTemplateResponseDto> {
    const template = await this.prisma.roleTemplate.findUnique({
      where: { templateId },
    });
    if (!template) {
      throw new NotFoundException('角色模板不存在');
    }
    return plainToInstance(RoleTemplateResponseDto, template, {
      excludeExtraneousValues: true,
    });
  }

  async getOptions(): Promise<
    {
      templateId: string;
      name: string;
      templateKey: string;
      sort: number;
    }[]
  > {
    return this.prisma.roleTemplate.findMany({
      where: { status: 'enabled' },
      select: {
        templateId: true,
        name: true,
        templateKey: true,
        sort: true,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
  }
}
