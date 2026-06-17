import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionsScannerService } from './permissions-scanner.service';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { Audit } from '@/core/decorators/audit.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { PERMISSION_PERMISSIONS } from '@/shared/constants/permissions.constant';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { PermissionResponseDto } from './dto/permission-response.dto';

@ApiTags('权限管理')
@Controller('system/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly scannerService: PermissionsScannerService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResponse({
    status: 200,
    description: '权限列表',
    type: [PermissionResponseDto],
  })
  async findAll(@Query() query: QueryPermissionDto) {
    const pageData = await this.permissionsService.findAll(query);
    return ResponseUtil.paginated(pageData, '权限列表');
  }

  @Get('flat')
  @RequirePermissions(PERMISSION_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取全部权限（平铺，供前端组装权限树）' })
  @ApiResponse({
    status: 200,
    description: '全部权限平铺列表',
    type: [PermissionResponseDto],
  })
  async findAllFlat() {
    const data = await this.permissionsService.findAllFlat();
    return ResponseUtil.found(data, '获取全部权限成功');
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取指定权限' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async findOne(@Param('id') id: string) {
    const data = await this.permissionsService.findOne(id);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_PERMISSIONS.UPDATE)
  @Audit('update')
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.permissionsService.update(
      id,
      updatePermissionDto,
      user.userId,
    );
    return ResponseUtil.updated(data, '更新成功');
  }

  @Post('scan')
  @RequirePermissions(PERMISSION_PERMISSIONS.SCAN)
  @ApiOperation({ summary: '扫描控制器并同步权限' })
  @ApiResponse({
    status: 200,
    description: '扫描成功',
    schema: {
      type: 'object',
      properties: {
        scanned: { type: 'number', description: '扫描到的权限数量' },
        created: { type: 'number', description: '新增的权限数量' },
        updated: { type: 'number', description: '更新的权限数量' },
        deleted: { type: 'number', description: '删除的权限数量' },
        assigned: {
          type: 'object',
          properties: {
            superAdmin: {
              type: 'object',
              properties: {
                total: { type: 'number', description: '超级管理员已绑定总数' },
                newAssigned: {
                  type: 'number',
                  description: '本次新增绑定数量',
                },
              },
            },
            admin: {
              type: 'object',
              properties: {
                total: { type: 'number', description: '管理员已绑定总数' },
                newAssigned: {
                  type: 'number',
                  description: '本次新增绑定数量',
                },
              },
            },
            guest: {
              type: 'object',
              properties: {
                total: { type: 'number', description: '游客已绑定总数' },
                newAssigned: {
                  type: 'number',
                  description: '本次新增绑定数量',
                },
              },
            },
          },
        },
      },
    },
  })
  async scanPermissions() {
    const stats = await this.scannerService.scanControllers();
    return ResponseUtil.success(stats, '权限扫描完成');
  }
}
