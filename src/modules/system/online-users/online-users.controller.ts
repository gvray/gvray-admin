import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OnlineUsersService } from './online-users.service';
import { QueryOnlineUsersDto } from './dto/query-online-users.dto';
import { OnlineUserItemDto } from './dto/online-user-item.dto';
import { SessionDetailDto } from './dto/session-detail.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { ONLINE_USER_PERMISSIONS } from '@/shared/constants/permissions.constant';
import { ResponseUtil } from '@/shared/utils/response.util';

@ApiTags('在线用户管理')
@Controller('system/online-users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OnlineUsersController {
  constructor(private readonly onlineUsersService: OnlineUsersService) {}

  @Get()
  @RequirePermissions(ONLINE_USER_PERMISSIONS.LIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: '在线用户列表' })
  @ApiResponse({
    status: 200,
    description: '在线用户分页列表',
    type: OnlineUserItemDto,
  })
  async list(@Query() query: QueryOnlineUsersDto) {
    const data = await this.onlineUsersService.getOnlineUsers(
      query.page,
      query.pageSize,
      query.keyword,
    );
    return ResponseUtil.paginated({
      items: data.items,
      total: data.total,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':userId/sessions')
  @RequirePermissions(ONLINE_USER_PERMISSIONS.VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查看某用户的所有会话' })
  @ApiResponse({
    status: 200,
    description: '会话列表',
    type: SessionDetailDto,
  })
  async sessions(@Param('userId') userId: string) {
    const data = await this.onlineUsersService.getUserSessions(userId);
    return ResponseUtil.found(data, '获取会话列表成功');
  }

  @Post(':userId/kick')
  @RequirePermissions(ONLINE_USER_PERMISSIONS.KICK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '踢用户下线（所有设备）' })
  @ApiResponse({ status: 200, description: '踢下线成功' })
  async kickUser(@Param('userId') userId: string) {
    await this.onlineUsersService.kickUser(userId);
    return ResponseUtil.success(null, '用户已被强制下线');
  }

  @Post(':userId/sessions/:tokenHash/kick')
  @RequirePermissions(ONLINE_USER_PERMISSIONS.KICK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '踢指定会话下线' })
  @ApiResponse({ status: 200, description: '会话已踢下线' })
  async kickSession(
    @Param('userId') userId: string,
    @Param('tokenHash') tokenHash: string,
  ) {
    await this.onlineUsersService.kickUserSession(userId, tokenHash);
    return ResponseUtil.success(null, '会话已踢下线');
  }
}
