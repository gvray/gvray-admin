import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

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

    await this.prisma.config.delete({
      where: { configId },
    });
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

  /**
   * 获取前端运行时配置（公开接口，无需认证）
   * - env：写死或读环境变量
   * - system / ui / security / user / feature / storage / oauth / mail / sms：从 config 表读取
   * - capabilities：动态计算
   */
  async getRuntimeConfig(): Promise<RuntimeConfigResponseDto> {
    // 1. 从 config 表批量读取管理员可改项
    const configKeys = [
      // system
      'system.name',
      'system.logo',
      'system.favicon',
      'system.welcomeMessage',
      'system.copyright',
      'system.icp',
      'system.timezone',
      // ui
      'ui.theme',
      'ui.language',
      'ui.pageSize',
      'ui.showBreadcrumb',
      'ui.sidebarCollapsed',
      'ui.dateFormat',
      'ui.timeFormat',
      // security
      'security.watermarkEnabled',
      'security.passwordMinLength',
      'security.passwordMaxLength',
      'security.passwordRequireComplexity',
      'security.passwordExpiryDays',
      'security.mustChangePassword',
      'security.loginFailureLockCount',
      'security.loginFailureLockDuration',
      'security.sessionConcurrentLimit',
      // user
      'user.defaultRole',
      'user.defaultAvatar',
      // feature
      'feature.register',
      'feature.auditLog',
      'feature.emailNotification',
      'feature.smsNotification',
      'feature.mfa',
      // storage
      'storage.provider',
      'storage.maxFileSize',
      'storage.allowedTypes',
      'storage.baseUrl',
      // oauth
      'oauth.githubEnabled',
      'oauth.googleEnabled',
      'oauth.wechatEnabled',
      // mail
      'mail.enabled',
      'mail.host',
      'mail.port',
      'mail.from',
      'mail.ssl',
      // sms
      'sms.enabled',
      'sms.provider',
      'sms.signature',
    ];

    const configs = await this.prisma.config.findMany({
      where: { key: { in: configKeys }, status: CommonStatus.ENABLED },
    });

    const configMap = new Map<string, string>();
    for (const c of configs) {
      configMap.set(c.key, c.value);
    }

    const str = (key: string, fallback: string) =>
      configMap.get(key) ?? fallback;
    const num = (key: string, fallback: number) => {
      const v = configMap.get(key);
      return v !== undefined ? Number(v) : fallback;
    };
    const bool = (key: string, fallback: boolean) => {
      const v = configMap.get(key);
      return v !== undefined ? v === 'true' || v === '1' : fallback;
    };

    // 2. 动态计算 capabilities
    const [totalUsers, totalRoles, totalPermissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.permission.count(),
    ]);

    return {
      system: {
        name: str('system.name', 'GVRAY Admin'),
        logo: str('system.logo', '/logo.svg'),
        favicon: str('system.favicon', '/favicon.ico'),
        welcomeMessage: str('system.welcomeMessage', '欢迎使用 GVRAY Admin'),
        copyright: str('system.copyright', '© 2025 GVRAY Admin. All rights reserved.'),
        icp: str('system.icp', ''),
        timezone: str('system.timezone', 'Asia/Shanghai'),
      },
      env: {
        mode: process.env.NODE_ENV || 'development',
        apiPrefix: '/api/v1',
      },
      ui: {
        theme: str('ui.theme', 'light'),
        language: str('ui.language', 'zh-CN'),
        pageSize: num('ui.pageSize', 10),
        showBreadcrumb: bool('ui.showBreadcrumb', true),
        sidebarCollapsed: bool('ui.sidebarCollapsed', false),
        dateFormat: str('ui.dateFormat', 'YYYY-MM-DD'),
        timeFormat: str('ui.timeFormat', 'HH:mm:ss'),
      },
      security: {
        watermarkEnabled: bool('security.watermarkEnabled', true),
        passwordMinLength: num('security.passwordMinLength', 8),
        passwordMaxLength: num('security.passwordMaxLength', 32),
        passwordRequireComplexity: bool('security.passwordRequireComplexity', true),
        passwordExpiryDays: num('security.passwordExpiryDays', 0),
        mustChangePassword: bool('security.mustChangePassword', true),
        loginFailureLockCount: num('security.loginFailureLockCount', 5),
        loginFailureLockDuration: num('security.loginFailureLockDuration', 30),
        sessionConcurrentLimit: num('security.sessionConcurrentLimit', 3),
      },
      user: {
        defaultRole: str('user.defaultRole', 'user'),
        defaultAvatar: str(
          'user.defaultAvatar',
          'https://api.dicebear.com/9.x/bottts/svg?seed=GVRAY',
        ),
      },
      feature: {
        register: bool('feature.register', true),
        auditLog: bool('feature.auditLog', true),
        emailNotification: bool('feature.emailNotification', true),
        smsNotification: bool('feature.smsNotification', false),
        mfa: bool('feature.mfa', false),
      },
      storage: {
        provider: str('storage.provider', 'local'),
        maxFileSize: num('storage.maxFileSize', 10485760),
        allowedTypes: str(
          'storage.allowedTypes',
          'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
        ),
        baseUrl: str('storage.baseUrl', ''),
      },
      oauth: {
        githubEnabled: bool('oauth.githubEnabled', false),
        googleEnabled: bool('oauth.googleEnabled', false),
        wechatEnabled: bool('oauth.wechatEnabled', false),
      },
      mail: {
        enabled: bool('mail.enabled', false),
        host: str('mail.host', ''),
        port: num('mail.port', 465),
        from: str('mail.from', ''),
        ssl: bool('mail.ssl', true),
      },
      sms: {
        enabled: bool('sms.enabled', false),
        provider: str('sms.provider', 'aliyun'),
        signature: str('sms.signature', ''),
      },
      capabilities: {
        totalUsers,
        totalRoles,
        totalPermissions,
      },
    };
  }

  async getConfigsByKeys(keys: string[]): Promise<Record<string, unknown>> {
    const configs = await this.prisma.config.findMany({
      where: {
        key: { in: keys },
        status: CommonStatus.ENABLED,
      },
    });

    const result: Record<string, unknown> = {};

    for (const config of configs) {
      const raw = config.value;
      let value: unknown;

      // 根据类型转换值
      switch (config.type) {
        case 'number':
          value = Number(raw);
          break;
        case 'boolean':
          value = raw === 'true' || raw === '1';
          break;
        case 'json':
          try {
            value = JSON.parse(raw);
          } catch {
            // 如果解析失败，保持原值
            value = raw;
          }
          break;
        default:
          // string类型，保持原值
          value = raw;
          break;
      }

      result[config.key] = value;
    }

    return result;
  }
}
