import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toDto } from '@/shared/utils/transform.util';
import { LogResult } from '@/shared/constants/log-result.constant';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateLoginLogDto } from './dto/create-login-log.dto';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { LoginLogResponseDto } from './dto/login-log-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { LoginStatsResponse } from './dto/login-stats-response.dto';

@Injectable()
export class LoginLogsService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {
    super(prisma, configService);
  }

  async create(
    createLoginLogDto: CreateLoginLogDto,
  ): Promise<LoginLogResponseDto> {
    const loginLog = await this.prisma.loginLog.create({
      data: createLoginLogDto,
    });

    return toDto(LoginLogResponseDto, loginLog);
  }

  async findAll(
    query: QueryLoginLogDto,
  ): Promise<PaginationData<LoginLogResponseDto>> {
    const {
      account,
      ipAddress,
      result,
      createdAtStart,
      createdAtEnd,
      location,
      device,
      browser,
      os,
      loginType,
    } = query;

    const where = this.buildWhere({
      contains: {
        account,
        ipAddress,
        location,
        device,
        browser,
        os,
        loginType,
      },
      equals: {
        result,
      },
      date: {
        field: 'createdAt',
        start: createdAtStart,
        end: createdAtEnd,
      },
    });

    return this.paginateWith(
      this.prisma.loginLog,
      query,
      { where, orderBy: [{ createdAt: 'desc' }] },
      LoginLogResponseDto,
    );
  }

  async findOne(id: number): Promise<LoginLogResponseDto> {
    const loginLog = await this.prisma.loginLog.findUnique({
      where: { id },
    });

    if (!loginLog) {
      throw new NotFoundException(`登录日志ID ${id} 不存在`);
    }

    return toDto(LoginLogResponseDto, loginLog);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.loginLog.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`登录日志ID ${id} 不存在`);
    }
    await this.prisma.loginLog.delete({
      where: { id },
    });
  }

  // 批量删除登录日志
  async removeMany(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.loginLog.deleteMany({
      where: { id: { in: ids } },
    });
  }

  // 清空所有登录日志
  async clearAll(): Promise<number> {
    const res = await this.prisma.loginLog.deleteMany({});
    return res.count;
  }

  // 清理指定天数之前的登录日志
  async cleanBeforeDays(days: number): Promise<number> {
    if (!Number.isInteger(days) || days < 1) {
      throw new BadRequestException('days 必须为正整数');
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const res = await this.prisma.loginLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    return res.count;
  }

  // 获取登录统计信息
  async getLoginStats(days: number = 7): Promise<LoginStatsResponse> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 总登录次数
    const totalLogins = await this.prisma.loginLog.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // 成功登录次数
    const successLogins = await this.prisma.loginLog.count({
      where: {
        createdAt: {
          gte: startDate,
        },
        result: LogResult.SUCCESS,
      },
    });

    // 失败登录次数
    const failedLogins = await this.prisma.loginLog.count({
      where: {
        createdAt: {
          gte: startDate,
        },
        result: LogResult.FAILURE,
      },
    });

    // 独立账户数（按 account 分组，组数即独立账户数）
    const uniqueAccountsAgg = await this.prisma.loginLog.groupBy({
      by: ['account'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    return {
      totalLogins,
      successLogins,
      failedLogins,
      uniqueAccounts: uniqueAccountsAgg.length,
      successRate: totalLogins > 0 ? (successLogins / totalLogins) * 100 : 0,
    };
  }
}
