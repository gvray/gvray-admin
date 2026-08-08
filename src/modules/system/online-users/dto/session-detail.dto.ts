import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 会话详情 DTO
 */
export class SessionDetailDto {
  @ApiProperty({ description: 'Token 哈希值' })
  @Expose()
  tokenHash: string;

  @ApiPropertyOptional({ description: 'IP 地址' })
  @Expose()
  ipAddress?: string;

  @ApiPropertyOptional({ description: '浏览器信息' })
  @Expose()
  browser?: string;

  @ApiPropertyOptional({ description: '操作系统信息' })
  @Expose()
  os?: string;

  @ApiPropertyOptional({ description: '设备信息' })
  @Expose()
  device?: string;

  @ApiPropertyOptional({ description: '登录地点' })
  @Expose()
  location?: string;

  @ApiProperty({
    description: '会话创建时间',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: '最后活跃时间',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  lastActiveAt: string;
}
