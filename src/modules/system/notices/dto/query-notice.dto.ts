import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationSortDto } from '@/shared/dtos/pagination.dto';

export class QueryNoticeDto extends PaginationSortDto {
  @ApiPropertyOptional({
    description: '关键词（匹配标题）',
    example: '系统维护',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '标题（模糊查询）', example: '维护' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '类型：notice-通知, announcement-通告' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: '状态：disabled-禁用, enabled-启用',
    example: 'enabled',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: '创建时间开始（YYYY-MM-DD）',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({
    description: '创建时间结束（YYYY-MM-DD）',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsString()
  createdAtEnd?: string;
}
