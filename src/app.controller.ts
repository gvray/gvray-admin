import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('健康检查')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: '服务健康检查' })
  @ApiResponse({ status: 200, description: '服务正常运行' })
  getHealth(): object {
    return this.appService.getHealth();
  }
}
