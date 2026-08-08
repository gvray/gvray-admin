import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { USER_PERMISSIONS } from '@/shared/constants/permissions.constant';

import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { GuestWriteGuard } from '@/core/guards/guest-write.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';

import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { OperationLog } from '@/core/decorators/operation-log.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { IUser } from '@/core/interfaces/user.interface';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeleteUsersDto } from './dto/batch-delete-users.dto';

@ApiTags('用户管理')
@Controller('system/users')
@UseGuards(JwtAuthGuard, GuestWriteGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(USER_PERMISSIONS.CREATE)
  @OperationLog({ module: '用户管理' })
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功', type: UserResponseDto })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: IUser,
  ) {
    const data = await this.usersService.create(
      createUserDto,
      currentUser.userId,
    );
    return ResponseUtil.created(data, '创建成功');
  }

  @Get()
  @RequirePermissions(USER_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({
    status: 200,
    description: '用户列表',
    type: [UserResponseDto],
  })
  async findAll(@Query() query?: QueryUserDto) {
    const pageData = await this.usersService.findAll(query);
    return ResponseUtil.paginated(pageData, '用户列表');
  }

  @Get(':userId')
  @RequirePermissions(USER_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取指定用户（通过UserId）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('userId') userId: string) {
    const data = await this.usersService.findOne(userId);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':userId')
  @RequirePermissions(USER_PERMISSIONS.UPDATE)
  @OperationLog({ module: '用户管理', action: 'update' })
  @ApiOperation({ summary: '更新用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '获取成功', type: UserResponseDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: IUser,
  ) {
    const data = await this.usersService.update(
      userId,
      updateUserDto,
      currentUser.userId,
    );
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete(':userId')
  @RequirePermissions(USER_PERMISSIONS.DELETE)
  @OperationLog({ module: '用户管理', action: 'delete' })
  @ApiOperation({ summary: '删除用户（通过UserId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: IUser,
  ) {
    await this.usersService.remove(userId, currentUser.userId);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Put(':userId/roles')
  @RequirePermissions(USER_PERMISSIONS.UPDATE_ROLES)
  @OperationLog({ module: '用户管理', action: 'update' })
  @ApiOperation({ summary: '为用户分配角色（替换所有角色）' })
  @ApiResponse({
    status: 200,
    description: '角色分配成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
    @CurrentUser() currentUser: IUser,
  ) {
    const data = await this.usersService.assignRoles(
      userId,
      assignRolesDto.roleIds,
      currentUser.userId,
    );
    return ResponseUtil.updated(data, '角色分配成功');
  }

  @Delete(':userId/roles')
  @RequirePermissions(USER_PERMISSIONS.UPDATE_ROLES)
  @OperationLog({ module: '用户管理', action: 'delete' })
  @ApiOperation({ summary: '移除用户的角色' })
  @ApiResponse({
    status: 200,
    description: '角色移除成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async removeRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
    @CurrentUser() currentUser: IUser,
  ) {
    const data = await this.usersService.removeRoles(
      userId,
      assignRolesDto.roleIds,
      currentUser.userId,
    );
    return ResponseUtil.updated(data, '角色移除成功');
  }

  @Post(':userId/reset-password')
  @RequirePermissions(USER_PERMISSIONS.RESET_PASSWORD)
  @OperationLog({ module: '用户管理', action: 'update' })
  @ApiOperation({ summary: '重置用户密码' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: '密码重置成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async resetPassword(
    @Param('userId') userId: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @CurrentUser() currentUser: IUser,
  ) {
    const data = await this.usersService.resetPassword(
      userId,
      resetPasswordDto.newPassword,
      currentUser.userId,
    );
    return ResponseUtil.updated(data, '密码重置成功');
  }

  @Post('batch-delete')
  @RequirePermissions(USER_PERMISSIONS.DELETE)
  @OperationLog({ module: '用户管理', action: 'delete' })
  @ApiOperation({ summary: '批量删除用户' })
  @ApiBody({ type: BatchDeleteUsersDto })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDelete(
    @Body() { ids }: BatchDeleteUsersDto,
    @CurrentUser() currentUser: IUser,
  ) {
    await this.usersService.removeMany(ids, currentUser.userId);
    return ResponseUtil.deleted(null, '删除成功');
  }
}
