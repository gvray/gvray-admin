import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class NoticeResponseDto {
  @Expose()
  @ApiProperty({ description: '通知ID' })
  noticeId: string;

  @Expose()
  @ApiProperty({ description: '标题' })
  title: string;

  @Expose()
  @ApiProperty({ description: '内容' })
  content: string;

  @Expose()
  @ApiProperty({ description: '类型' })
  type: string;

  @Expose()
  @ApiProperty({ description: '状态' })
  status: string;

  @Expose()
  @ApiProperty({ description: '排序权重', type: 'integer' })
  sort: number;

  @Expose()
  @ApiPropertyOptional({ description: '是否已读', type: 'boolean' })
  isRead?: boolean;

  @Expose()
  @ApiProperty({ description: '创建时间', type: 'string', format: 'date-time' })
  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: '更新时间', type: 'string', format: 'date-time' })
  @Transform(({ value }) => value?.toISOString())
  updatedAt: Date;
}
