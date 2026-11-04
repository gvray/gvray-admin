import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toDto } from '@/shared/utils/transform.util';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';
import { PositionResponseDto } from './dto/position-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { OPTIONS_MAX_LIMIT } from '@/shared/constants/options.constant';

@Injectable()
export class PositionsService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {
    super(prisma, configService);
  }

  async create(
    createPositionDto: CreatePositionDto,
    currentUserId?: string,
  ): Promise<PositionResponseDto> {
    // 检查名称和编码是否已存在
    const existingPosition = await this.prisma.position.findFirst({
      where: {
        OR: [
          { name: createPositionDto.name },
          { code: createPositionDto.code },
        ],
      },
    });

    if (existingPosition) {
      if (existingPosition.name === createPositionDto.name) {
        throw new ConflictException('岗位名称已存在');
      }
      if (existingPosition.code === createPositionDto.code) {
        throw new ConflictException('岗位编码已存在');
      }
    }

    const position = await this.prisma.position.create({
      data: {
        ...createPositionDto,
        createdById: currentUserId,
      },
    });

    return toDto(PositionResponseDto, position);
  }

  async findAll(
    query: QueryPositionDto,
  ): Promise<PaginationData<PositionResponseDto>> {
    const { name, code, status, createdAtStart, createdAtEnd } = query;
    const where = this.buildWhere({
      contains: { name, code },
      equals: { status },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    const include = {
      userPositions: {
        select: {
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
    };
    return this.paginateWith(
      this.prisma.position,
      query,
      { where, orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }], include },
      PositionResponseDto,
    );
  }

  async findOne(id: string): Promise<PositionResponseDto> {
    const position = await this.prisma.position.findUnique({
      where: { positionId: id },
    });

    if (!position) {
      throw new NotFoundException(`岗位ID ${id} 不存在`);
    }

    return toDto(PositionResponseDto, position);
  }

  async update(
    id: string,
    updatePositionDto: UpdatePositionDto,
    currentUserId?: string,
  ): Promise<PositionResponseDto> {
    const existingPosition = await this.prisma.position.findUnique({
      where: { positionId: id },
    });

    if (!existingPosition) {
      throw new NotFoundException(`岗位ID ${id} 不存在`);
    }

    // 检查名称和编码是否已被其他岗位使用
    if (updatePositionDto.name || updatePositionDto.code) {
      const conflictPosition = await this.prisma.position.findFirst({
        where: {
          positionId: { not: existingPosition.positionId },
          OR: [
            updatePositionDto.name ? { name: updatePositionDto.name } : {},
            updatePositionDto.code ? { code: updatePositionDto.code } : {},
          ].filter((condition) => Object.keys(condition).length > 0),
        },
      });

      if (conflictPosition) {
        if (
          updatePositionDto.name &&
          conflictPosition.name === updatePositionDto.name
        ) {
          throw new ConflictException('岗位名称已存在');
        }
        if (
          updatePositionDto.code &&
          conflictPosition.code === updatePositionDto.code
        ) {
          throw new ConflictException('岗位编码已存在');
        }
      }
    }

    const position = await this.prisma.position.update({
      where: { positionId: existingPosition.positionId },
      data: {
        ...updatePositionDto,
        updatedById: currentUserId,
      },
    });

    return toDto(PositionResponseDto, position);
  }

  async remove(id: string): Promise<void> {
    const existingPosition = await this.prisma.position.findUnique({
      where: { positionId: id },
    });

    if (!existingPosition) {
      throw new NotFoundException(`岗位ID ${id} 不存在`);
    }

    await this.prisma.position.delete({
      where: { positionId: id },
    });
  }

  async removeMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.position.deleteMany({
      where: { positionId: { in: ids } },
    });
  }

  async getOptions(): Promise<
    {
      positionId: string;
      name: string;
      code: string;
      sort: number;
    }[]
  > {
    return this.prisma.position.findMany({
      where: { status: 'enabled' },
      select: {
        positionId: true,
        name: true,
        code: true,
        sort: true,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      take: OPTIONS_MAX_LIMIT,
    });
  }
}
