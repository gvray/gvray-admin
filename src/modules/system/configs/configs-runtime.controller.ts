import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { RuntimeConfigResponseDto } from './dto/runtime-config-response.dto';
import { ResponseUtil } from '@/shared/utils/response.util';

@ApiTags('运行时配置')
@Controller('public')
export class ConfigsRuntimeController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get('runtime-config')
  @ApiOperation({
    summary: '获取前端运行时配置',
    description:
      '公开接口，无需认证。前端初始化系统时拉取必要配置。仅返回 config 表中 isPublic=true 的配置，按 group 动态分组聚合。敏感配置（如 mail/sms 后端凭据）默认不暴露，管理员可通过配置管理后台调整 isPublic 字段灵活控制。',
  })
  @ApiResponse({
    status: 200,
    description: '运行时配置（仅安全字段）',
    type: RuntimeConfigResponseDto,
  })
  async getRuntimeConfig() {
    const data = await this.configsService.getPublicRuntimeConfig();
    return ResponseUtil.success(data, '获取运行时配置成功');
  }
}
