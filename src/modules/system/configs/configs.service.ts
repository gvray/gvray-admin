import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommonStatus } from '@/shared/constants/common-status.constant';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
import { RuntimeConfigResponseDto } from './dto/runtime-config-response.dto';
import { plainToInstance } from 'class-transformer';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';

@Injectable()
export class ConfigsService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService,
  ) {
    super(prisma, configService);
  }

  // ==================== CRUD ====================

  async create(
    createConfigDto: CreateConfigDto,
    userId: string,
  ): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.create({
      data: {
        ...createConfigDto,
        createdById: userId,
      },
    });
    return plainToInstance(ConfigResponseDto, config, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryConfigDto,
  ): Promise<PaginationData<ConfigResponseDto>> {
    const { key, name, type, group, status, isPublic, createdAtStart, createdAtEnd } =
      query;
    const where = this.buildWhere({
      contains: { key, name },
      equals: { type, group, status },
      boolean: { field: 'isPublic', value: isPublic },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });

    const state = this.getPaginationState(query);
    const [configs, total] = await Promise.all([
      this.prisma.config.findMany({
        where,
        orderBy: { sort: 'asc' },
        skip: state.skip,
        take: state.take,
      }),
      this.prisma.config.count({ where }),
    ]);
    const transformed = configs.map((config) =>
      plainToInstance(ConfigResponseDto, config, {
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

  async findOne(configId: string): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { configId },
    });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }
    return plainToInstance(ConfigResponseDto, config, {
      excludeExtraneousValues: true,
    });
  }

  async findByKey(key: string): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { key },
    });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }
    return plainToInstance(ConfigResponseDto, config, {
      excludeExtraneousValues: true,
    });
  }

  async findByGroup(group: string): Promise<ConfigResponseDto[]> {
    const configs = await this.prisma.config.findMany({
      where: { group, status: CommonStatus.ENABLED },
      orderBy: { sort: 'asc' },
    });
    return configs.map((config) =>
      plainToInstance(ConfigResponseDto, config, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async update(
    configId: string,
    updateConfigDto: UpdateConfigDto,
    userId: string,
  ): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { configId },
    });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }
    const updatedConfig = await this.prisma.config.update({
      where: { configId },
      data: {
        ...updateConfigDto,
        updatedById: userId,
      },
    });
    return plainToInstance(ConfigResponseDto, updatedConfig, {
      excludeExtraneousValues: true,
    });
  }

  async remove(configId: string): Promise<void> {
    const config = await this.prisma.config.findUnique({
      where: { configId },
    });
    if (!config) {
      throw new NotFoundException('配置不存在');
    }
    await this.prisma.config.delete({ where: { configId } });
  }

  async removeMany(ids: string[]): Promise<void> {
    const validIds = ids.filter(
      (id) => typeof id === 'string' && id.length > 0,
    );
    if (validIds.length === 0) {
      throw new BadRequestException('缺少有效的配置ID列表');
    }
    await this.prisma.config.deleteMany({
      where: { configId: { in: validIds } },
    });
  }

  // ==================== 运行时配置（动态聚合）====================

  // TODO: [Redis] 缓存运行时配置聚合结果
  // 当前 buildRuntimeConfig() 每次请求都全量查 config 表并执行 3 次 COUNT。
  // 后续接入 Redis 后以 `config:runtime` 缓存聚合后的 JSON，TTL 5-10 分钟。
  async getRuntimeConfig(): Promise<RuntimeConfigResponseDto> {
    return this.buildRuntimeConfig();
  }

  /**
   * 获取公开运行时配置（供前端无鉴权初始化使用）
   * 仅返回 config 表中 isPublic=true 的配置，按 group 动态分组聚合
   */
  async getPublicRuntimeConfig(): Promise<Partial<RuntimeConfigResponseDto>> {
    return this.buildPublicRuntimeConfig();
  }

  // ==================== 私有方法 ====================

  private async buildRuntimeConfig(): Promise<RuntimeConfigResponseDto> {
    const groups = await this.buildConfigCore();
    const [totalUsers, totalRoles, totalPermissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.permission.count(),
    ]);

    return {
      ...groups,
      capabilities: {
        totalUsers,
        totalRoles,
        totalPermissions,
      },
    } as RuntimeConfigResponseDto;
  }

  private async buildPublicRuntimeConfig(): Promise<Partial<RuntimeConfigResponseDto>> {
    return this.buildConfigCore({ publicOnly: true });
  }

  private async buildConfigCore(
    options?: { publicOnly?: boolean },
  ): Promise<Record<string, any>> {
    const where: any = { status: CommonStatus.ENABLED };
    if (options?.publicOnly) {
      where.isPublic = true;
    }

    const configs = await this.prisma.config.findMany({
      where,
      orderBy: [{ group: 'asc' }, { sort: 'asc' }],
    });

    // 按 group.field 自动分组 + 类型转换
    const groups: Record<string, Record<string, unknown>> = {};
    for (const c of configs) {
      const dotIndex = c.key.indexOf('.');
      const group = dotIndex > 0 ? c.key.slice(0, dotIndex) : 'misc';
      const field = dotIndex > 0 ? c.key.slice(dotIndex + 1) : c.key;

      if (!groups[group]) groups[group] = {};
      groups[group][field] = this.castValue(c.value, c.type);
    }

    return {
      ...groups,
    };
  }

  private castValue(raw: string, type: string): unknown {
    switch (type) {
      case 'number':
        return Number(raw);
      case 'boolean':
        return raw === 'true' || raw === '1';
      case 'json':
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      default:
        return raw;
    }
  }

  // ==================== 功能开关（Feature Flag）====================

  private featureCache = new Map<
    string,
    { value: boolean; expiresAt: number }
  >();
  private readonly FEATURE_CACHE_TTL_MS = 60_000; // 60 秒内存缓存

  /**
   * 检查指定功能开关是否启用
   * 直接查 config 表，不走 getRuntimeConfig，避免不必要的 count 查询
   *
   * 带 60 秒内存缓存，减轻高频请求时的数据库压力。
   * TODO: [Redis] 后续接入 Redis 后以 `feature:{key}` 缓存布尔值，TTL 1-5 分钟，配置变更时清除。
   */
  async isFeatureEnabled(key: string): Promise<boolean> {
    const cacheKey = `feature.${key}`;
    const cached = this.featureCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const config = await this.prisma.config.findUnique({
      where: { key: cacheKey },
    });

    const enabled =
      !!config &&
      config.status === CommonStatus.ENABLED &&
      this.castValue(config.value, config.type) === true;

    this.featureCache.set(cacheKey, {
      value: enabled,
      expiresAt: Date.now() + this.FEATURE_CACHE_TTL_MS,
    });

    return enabled;
  }

  /**
   * 清除功能开关缓存（配置变更后调用）
   */
  clearFeatureCache(key?: string): void {
    if (key) {
      this.featureCache.delete(`feature.${key}`);
    } else {
      this.featureCache.clear();
    }
  }

  // ==================== 批量查询（保持兼容）====================

  async getConfigsByKeys(keys: string[]): Promise<Record<string, unknown>> {
    const configs = await this.prisma.config.findMany({
      where: {
        key: { in: keys },
        status: CommonStatus.ENABLED,
      },
    });

    const result: Record<string, unknown> = {};
    for (const config of configs) {
      result[config.key] = this.castValue(config.value, config.type);
    }
    return result;
  }
}
