import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UserPermissionsResponseDto } from './dto/user-permissions-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

@ApiTags('个人中心')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: '获取个人资料',
    description: '返回当前用户的个人资料信息（昵称、头像、联系方式等）',
  })
  @ApiResponse({
    status: 200,
    description: '个人资料',
    type: ProfileResponseDto,
  })
  async getProfile(@CurrentUser() user: { userId: string }) {
    const data = await this.profileService.getProfile(user.userId);
    return ResponseUtil.found(data, '获取个人资料成功');
  }

  @Get('permissions')
  @ApiOperation({ summary: '获取当前用户角色与权限' })
  @ApiResponse({
    status: 200,
    description: '当前用户角色与权限列表',
    type: UserPermissionsResponseDto,
  })
  async getPermissions(@CurrentUser() user: { userId: string }) {
    const data = await this.profileService.getPermissions(user.userId);
    return ResponseUtil.found(data, '获取权限成功');
  }

  @Patch()
  @ApiOperation({ summary: '更新个人信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.profileService.updateProfile(user.userId, dto);
    return ResponseUtil.success(data, '更新个人信息成功');
  }

  @Post('change-password')
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 400, description: '当前密码不正确' })
  @ApiResponse({ status: 403, description: '演示环境，游客账号仅支持查看操作' })
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.profileService.changePassword(user.userId, dto);
    return ResponseUtil.success(null, '密码修改成功');
  }

  @Get('settings')
  @ApiOperation({ summary: '获取个人偏好设置' })
  @ApiResponse({
    status: 200,
    description: '偏好设置',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        theme: 'light',
        language: 'zh-CN',
        sidebarCollapsed: false,
        pageSize: 20,
      },
    },
  })
  async getSettings(@CurrentUser() user: { userId: string }) {
    const data = await this.profileService.getSettings(user.userId);
    return ResponseUtil.found(data, '获取偏好设置成功');
  }

  @Patch('settings')
  @ApiOperation({ summary: '更新个人偏好设置' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        theme: 'light',
        language: 'zh-CN',
        sidebarCollapsed: false,
        pageSize: 20,
      },
    },
  })
  async updateSettings(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    const data = await this.profileService.updateSettings(user.userId, dto);
    return ResponseUtil.success(data, '更新偏好设置成功');
  }

  @Delete('settings')
  @ApiOperation({ summary: '重置个人偏好设置' })
  @ApiResponse({
    status: 200,
    description: '重置成功',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {},
    },
  })
  async resetSettings(@CurrentUser() user: { userId: string }) {
    const data = await this.profileService.resetSettings(user.userId);
    return ResponseUtil.success(data, '偏好设置已重置');
  }

  @Get('login-logs')
  @ApiOperation({ summary: '获取个人登录日志' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLoginLogs(
    @CurrentUser() user: { userId: string },
    @Query() query: PaginationDto,
  ) {
    const data = await this.profileService.getLoginLogs(user.userId, query);
    return ResponseUtil.paginated(data, '获取登录日志成功');
  }
}
