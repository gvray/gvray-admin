import { Injectable, NotFoundException } from '@nestjs/common';
import { toDto } from '@/shared/utils/transform.util';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { QueryNoticeDto } from './dto/query-notice.dto';
import { NoticeResponseDto } from './dto/notice-response.dto';

@Injectable()
export class NoticesService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {
    super(prisma, configService);
  }

  async create(
    createNoticeDto: CreateNoticeDto,
    currentUserId?: string,
  ): Promise<NoticeResponseDto> {
    const notice = await this.prisma.notice.create({
      data: {
        ...createNoticeDto,
        createdById: currentUserId,
      },
    });
    return toDto(NoticeResponseDto, notice);
  }

  async findAll(
    query: QueryNoticeDto,
    currentUserId?: string,
  ): Promise<PaginationData<NoticeResponseDto>> {
    const { keyword, title, type, status, createdAtStart, createdAtEnd } =
      query;
    const where = this.buildWhere({
      contains: { title: keyword || title },
      equals: { type, status },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });

    const base = await this.paginateWith(
      this.prisma.notice,
      query,
      { where, orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }] },
      NoticeResponseDto,
    );

    // 查询当前用户的已读记录
    let readNoticeIds = new Set<string>();
    if (currentUserId) {
      const reads = await this.prisma.userNoticeRead.findMany({
        where: {
          userId: currentUserId,
          noticeId: { in: base.items.map((i) => i.noticeId) },
        },
        select: { noticeId: true },
      });
      readNoticeIds = new Set(reads.map((r) => r.noticeId));
    }

    if (currentUserId) {
      for (const dto of base.items) {
        dto.isRead = readNoticeIds.has(dto.noticeId);
      }
    }

    return base;
  }

  async findOne(
    noticeId: string,
    currentUserId?: string,
  ): Promise<NoticeResponseDto> {
    const notice = await this.prisma.notice.findUnique({
      where: { noticeId },
    });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }

    const dto = toDto(NoticeResponseDto, notice);
    if (currentUserId) {
      const read = await this.prisma.userNoticeRead.findUnique({
        where: {
          userId_noticeId: { userId: currentUserId, noticeId },
        },
      });
      dto.isRead = !!read;
    }
    return dto;
  }

  async update(
    noticeId: string,
    updateNoticeDto: UpdateNoticeDto,
    currentUserId?: string,
  ): Promise<NoticeResponseDto> {
    const notice = await this.prisma.notice.findUnique({
      where: { noticeId },
    });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }

    const updated = await this.prisma.notice.update({
      where: { noticeId },
      data: {
        ...updateNoticeDto,
        updatedById: currentUserId,
      },
    });

    return toDto(NoticeResponseDto, updated);
  }

  async remove(noticeId: string): Promise<void> {
    const notice = await this.prisma.notice.findUnique({
      where: { noticeId },
    });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }
    await this.prisma.notice.delete({ where: { noticeId } });
  }

  async removeMany(ids: string[]): Promise<void> {
    await this.prisma.notice.deleteMany({
      where: { noticeId: { in: ids } },
    });
  }

  // ==================== 已读状态 ====================

  async getUnreadCount(userId: string): Promise<number> {
    const totalEnabled = await this.prisma.notice.count({
      where: { status: 'enabled' },
    });
    const readCount = await this.prisma.userNoticeRead.count({
      where: {
        userId,
        notice: { status: 'enabled' },
      },
    });
    return Math.max(0, totalEnabled - readCount);
  }

  async markAsRead(userId: string, noticeId: string): Promise<void> {
    await this.prisma.userNoticeRead.upsert({
      where: {
        userId_noticeId: { userId, noticeId },
      },
      update: {},
      create: { userId, noticeId },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notices = await this.prisma.notice.findMany({
      where: { status: 'enabled' },
      select: { noticeId: true },
    });

    if (notices.length === 0) return;

    await this.prisma.userNoticeRead.createMany({
      data: notices.map((n) => ({ userId, noticeId: n.noticeId })),
      skipDuplicates: true,
    });
  }
}
