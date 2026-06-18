import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { MONITOR_PERMISSIONS } from '@/shared/constants/permissions.constant';
import { MonitorService } from './monitor.service';
import { ServerMetricsResponseDto } from './dto/server-metrics-response.dto';

@ApiTags('系统监控')
@Controller('system/monitors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

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
}
