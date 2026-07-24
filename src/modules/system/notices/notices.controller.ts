import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { QueryNoticeDto } from './dto/query-notice.dto';
import { NoticeResponseDto } from './dto/notice-response.dto';
import { BatchDeleteNoticesDto } from './dto/batch-delete-notices.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { GuestWriteGuard } from '@/core/guards/guest-write.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { OperationLog } from '@/core/decorators/operation-log.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { ResponseUtil } from '@/shared/utils/response.util';
import { NOTICE_PERMISSIONS } from '@/shared/constants/permissions.constant';

@ApiTags('通知通告')
@Controller('system/notices')
@UseGuards(JwtAuthGuard, GuestWriteGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @RequirePermissions(NOTICE_PERMISSIONS.CREATE)
  @OperationLog({ module: '通知通告' })
  @ApiOperation({ summary: '创建通知' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: NoticeResponseDto,
  })
  async create(
    @Body() createNoticeDto: CreateNoticeDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.noticesService.create(createNoticeDto, user.userId);
    return ResponseUtil.created(data, '创建成功');
  }

  @Get()
  @RequirePermissions(NOTICE_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取通知列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [NoticeResponseDto],
  })
  async findAll(
    @Query() query: QueryNoticeDto = new QueryNoticeDto(),
    @CurrentUser() user: IUser,
  ) {
    const pageData = await this.noticesService.findAll(query, user.userId);
    return ResponseUtil.paginated(pageData, '通知列表获取成功');
  }

  @Get(':noticeId')
  @RequirePermissions(NOTICE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取通知详情' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: NoticeResponseDto,
  })
  async findOne(
    @Param('noticeId') noticeId: string,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.noticesService.findOne(noticeId, user.userId);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':noticeId')
  @RequirePermissions(NOTICE_PERMISSIONS.UPDATE)
  @OperationLog({ module: '通知通告', action: 'update' })
  @ApiOperation({ summary: '更新通知' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: NoticeResponseDto,
  })
  async update(
    @Param('noticeId') noticeId: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.noticesService.update(
      noticeId,
      updateNoticeDto,
      user.userId,
    );
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete(':noticeId')
  @RequirePermissions(NOTICE_PERMISSIONS.DELETE)
  @OperationLog({ module: '通知通告', action: 'delete' })
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  async remove(
    @Param('noticeId') noticeId: string,
    @CurrentUser() user: IUser,
  ) {
    await this.noticesService.remove(noticeId);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions(NOTICE_PERMISSIONS.DELETE)
  @OperationLog({ module: '通知通告', action: 'delete' })
  @ApiOperation({ summary: '批量删除通知' })
  @ApiBody({ type: BatchDeleteNoticesDto })
  async batchDelete(
    @Body() dto: BatchDeleteNoticesDto,
    @CurrentUser() user: IUser,
  ) {
    await this.noticesService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }

  // ==================== 前端铃铛接口 ====================

  @Get('unread/count')
  @ApiOperation({ summary: '获取当前用户未读通知数量' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: { type: 'object', properties: { count: { type: 'integer' } } },
  })
  async getUnreadCount(@CurrentUser() user: IUser) {
    const count = await this.noticesService.getUnreadCount(user.userId);
    return ResponseUtil.success({ count }, '获取成功');
  }

  @Post(':noticeId/read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({
    status: 200,
    description: '标记成功',
  })
  async markAsRead(
    @Param('noticeId') noticeId: string,
    @CurrentUser() user: IUser,
  ) {
    await this.noticesService.markAsRead(user.userId, noticeId);
    return ResponseUtil.success(null, '标记已读成功');
  }

  @Post('read-all')
  @ApiOperation({ summary: '标记全部通知为已读' })
  @ApiResponse({
    status: 200,
    description: '标记成功',
  })
  async markAllAsRead(@CurrentUser() user: IUser) {
    await this.noticesService.markAllAsRead(user.userId);
    return ResponseUtil.success(null, '全部标记已读成功');
  }
}
