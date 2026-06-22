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
    private readonly configService: ConfigService,
  ) {
    super(prisma);
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
    const { key, name, type, group, status, createdAtStart, createdAtEnd } =
      query;
    const where = this.buildWhere({
      contains: { key, name },
      equals: { type, group, status },
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

  async getRuntimeConfig(): Promise<RuntimeConfigResponseDto> {
    return this.buildRuntimeConfig();
  }

  /**
   * 获取公开运行时配置（供前端无鉴权初始化使用）
   * 过滤掉敏感字段：security、storage、oauth、mail、sms、capabilities
   */
  async getPublicRuntimeConfig(): Promise<Partial<RuntimeConfigResponseDto>> {
    return this.buildPublicRuntimeConfig();
  }

  // ==================== 私有方法 ====================

  private async buildRuntimeConfig(): Promise<RuntimeConfigResponseDto> {
    const full = await this.buildConfigCore();
    const [totalUsers, totalRoles, totalPermissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.permission.count(),
    ]);

    return {
      ...full,
      security: full.security,
      storage: full.storage,
      oauth: full.oauth,
      mail: full.mail,
      sms: full.sms,
      capabilities: {
        totalUsers,
        totalRoles,
        totalPermissions,
      },
    } as RuntimeConfigResponseDto;
  }

  private async buildPublicRuntimeConfig(): Promise<Partial<RuntimeConfigResponseDto>> {
    const full = await this.buildConfigCore();
    return {
      system: full.system,
      env: full.env,
      ui: full.ui,
      user: full.user,
      feature: full.feature,
    };
  }

  private async buildConfigCore(): Promise<Record<string, any>> {
    // 1. 读取 config 表所有 enabled 配置（动态聚合，不再硬编码 key）
    const configs = await this.prisma.config.findMany({
      where: { status: CommonStatus.ENABLED },
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

    const pick = (g: string, defaults: Record<string, unknown>) => ({
      ...defaults,
      ...(groups[g] || {}),
    });

    const apiPrefix =
      this.configService.get<string>('APP_GLOBAL_PREFIX') || '/api/v1';

    return {
      system: pick('system', {
        name: 'GVRAY Admin',
        logo: '/logo.svg',
        favicon: '/favicon.ico',
        welcomeMessage: '欢迎使用 GVRAY Admin',
        copyright: '© 2025 GVRAY Admin. All rights reserved.',
        icp: '',
        timezone: 'Asia/Shanghai',
      }),
      env: {
        mode: process.env.NODE_ENV || 'development',
        apiPrefix,
      },
      ui: pick('ui', {
        theme: 'light',
        language: 'zh-CN',
        pageSize: 10,
        showBreadcrumb: true,
        sidebarCollapsed: false,
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        primaryColor: '#1890ff',
        timezone: 'Asia/Shanghai',
        enableNotification: true,
        grayMode: false,
      }),
      security: pick('security', {
        watermarkEnabled: true,
        passwordMinLength: 8,
        passwordMaxLength: 32,
        passwordRequireComplexity: true,
        passwordExpiryDays: 0,
        mustChangePassword: true,
        loginFailureLockCount: 5,
        loginFailureLockDuration: 30,
        sessionConcurrentLimit: 3,
      }),
      user: pick('user', {
        defaultRole: 'user',
        defaultAvatar:
          'https://api.dicebear.com/9.x/bottts/svg?seed=GVRAY',
      }),
      feature: pick('feature', {
        register: true,
        auditLog: true,
        emailNotification: true,
        smsNotification: false,
        mfa: false,
      }),
      storage: pick('storage', {
        provider: 'local',
        maxFileSize: 10485760,
        allowedTypes: 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
        baseUrl: '',
      }),
      oauth: pick('oauth', {
        githubEnabled: false,
        googleEnabled: false,
        wechatEnabled: false,
      }),
      mail: pick('mail', {
        enabled: false,
        host: '',
        port: 465,
        from: '',
        ssl: true,
      }),
      sms: pick('sms', {
        enabled: false,
        provider: 'aliyun',
        signature: '',
      }),
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

  /**
   * 检查指定功能开关是否启用
   * 直接查 config 表，不走 getRuntimeConfig，避免不必要的 count 查询
   */
  async isFeatureEnabled(key: string): Promise<boolean> {
    const config = await this.prisma.config.findUnique({
      where: { key: `feature.${key}` },
    });

    if (!config || config.status !== CommonStatus.ENABLED) {
      return false;
    }

    return this.castValue(config.value, config.type) === true;
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
