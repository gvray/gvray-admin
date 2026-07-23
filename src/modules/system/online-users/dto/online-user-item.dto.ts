import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 在线用户列表项 DTO
 */
export class OnlineUserItemDto {
  @ApiProperty({ description: '用户ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: '昵称' })
  @Expose()
  nickname: string;

  @ApiPropertyOptional({ description: '头像地址' })
  @Expose()
  avatar?: string;

  @ApiProperty({ description: '用户状态' })
  @Expose()
  status: string;

  @ApiProperty({ description: '会话数量', type: 'integer' })
  @Expose()
  sessionCount: number;

  @ApiProperty({ description: '首次登录时间', type: 'string', format: 'date-time' })
  @Expose()
  loginAt: string;

  @ApiProperty({ description: '最后活跃时间', type: 'string', format: 'date-time' })
  @Expose()
  lastActiveAt: string;
}
