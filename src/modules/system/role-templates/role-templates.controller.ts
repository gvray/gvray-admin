import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleTemplatesService } from './role-templates.service';
import { QueryRoleTemplateDto } from './dto/query-role-template.dto';
import { RoleTemplateResponseDto } from './dto/role-template-response.dto';

import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { GuestWriteGuard } from '@/core/guards/guest-write.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { ROLE_PERMISSIONS } from '@/shared/constants/permissions.constant';

@ApiTags('角色模板管理')
@Controller('system/role-templates')
@UseGuards(JwtAuthGuard, GuestWriteGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class RoleTemplatesController {
  constructor(private readonly service: RoleTemplatesService) {}

  @Get()
  @RequirePermissions(ROLE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取角色模板列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [RoleTemplateResponseDto] })
  async findAll(@Query() query: QueryRoleTemplateDto) {
    const pageData = await this.service.findAll(query);
    return ResponseUtil.paginated(pageData, '获取成功');
  }

  @Get('options')
  @RequirePermissions(ROLE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取角色模板选项' })
  async getOptions() {
    const data = await this.service.getOptions();
    return ResponseUtil.found(data, '获取角色模板选项成功');
  }

  @Get(':templateId')
  @RequirePermissions(ROLE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取指定角色模板' })
  @ApiResponse({ status: 200, description: '获取成功', type: RoleTemplateResponseDto })
  async findOne(@Param('templateId') templateId: string) {
    const data = await this.service.findOne(templateId);
    return ResponseUtil.found(data, '获取成功');
  }
}
