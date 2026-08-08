import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { GuestWriteGuard } from '@/core/guards/guest-write.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import {
  MONITOR_PERMISSIONS,
  CACHE_PERMISSIONS,
} from '@/shared/constants/permissions.constant';
import { MonitorService } from './monitor.service';
import { CacheMonitorService } from './cache-monitor.service';
import { ServerMetricsResponseDto } from './dto/server-metrics-response.dto';
import { CacheStatsDto } from './dto/cache-stats.dto';
import {
  CacheKeyInfoDto,
  CacheKeyValueDto,
  CacheClearResultDto,
  CacheKeyListResponseDto,
  CacheKeyQueryDto,
} from './dto/cache-key-info.dto';

@ApiTags('系统监控')
@Controller('system/monitors')
@UseGuards(JwtAuthGuard, GuestWriteGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class MonitorController {
  constructor(
    private readonly monitorService: MonitorService,
    private readonly cacheMonitorService: CacheMonitorService,
  ) {}

  @Get('server-metrics')
  @RequirePermissions(MONITOR_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取服务器系统监控指标' })
  @ApiResponse({
    status: 200,
    description: '系统监控指标',
    type: ServerMetricsResponseDto,
  })
  async getServerMetrics() {
    const data = await this.monitorService.getServerMetrics();
    const dto = plainToInstance(ServerMetricsResponseDto, data, {
      excludeExtraneousValues: true,
    });
    return ResponseUtil.found(dto, '获取系统监控指标成功');
  }

  // ==================== 缓存监控 ====================

  @Get('cache-stats')
  @RequirePermissions(CACHE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取缓存统计信息' })
  @ApiResponse({
    status: 200,
    description: '缓存统计',
    type: CacheStatsDto,
  })
  async getCacheStats() {
    const data = await this.cacheMonitorService.getStats();
    return ResponseUtil.found(data, '获取缓存统计成功');
  }

  @Get('cache-keys')
  @RequirePermissions(CACHE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '按 pattern 扫描缓存 key 列表' })
  @ApiResponse({
    status: 200,
    description: 'key 列表',
    type: CacheKeyListResponseDto,
  })
  async getCacheKeys(@Query() query: CacheKeyQueryDto) {
    const data = await this.cacheMonitorService.getKeys(
      query.pattern,
      query.page,
      query.pageSize,
    );
    return ResponseUtil.paginated(data, '获取缓存 key 列表成功');
  }

  @Get('cache-key')
  @RequirePermissions(CACHE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '查看单个缓存 key 的值' })
  @ApiQuery({
    name: 'key',
    required: true,
    description: '完整缓存 key',
    example: 'sys:dict:items:gender',
  })
  @ApiResponse({
    status: 200,
    description: 'key 详情',
    type: CacheKeyValueDto,
  })
  async getCacheKey(@Query('key') key: string) {
    const data = await this.cacheMonitorService.getKeyValue(key);
    return ResponseUtil.found(data, '获取缓存 key 详情成功');
  }

  @Delete('cache-clear')
  @RequirePermissions(CACHE_PERMISSIONS.CLEAR)
  @ApiOperation({ summary: '按 pattern 清理缓存' })
  @ApiQuery({
    name: 'pattern',
    required: true,
    description: 'key 匹配模式，如 sys:dict:*',
    example: 'sys:dict:*',
  })
  @ApiResponse({
    status: 200,
    description: '清理结果',
    type: CacheClearResultDto,
  })
  async clearCache(@Query('pattern') pattern: string) {
    const data = await this.cacheMonitorService.clearCache(pattern);
    return ResponseUtil.updated(data, '清理缓存成功');
  }

  @Get('cache-health')
  @RequirePermissions(CACHE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: 'Redis 健康检查' })
  async getCacheHealth() {
    const data = await this.cacheMonitorService.getHealth();
    return ResponseUtil.found(data, '获取 Redis 健康状态成功');
  }
}
