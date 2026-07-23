import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

/**
 * 在线用户列表查询 DTO
 */
export class QueryOnlineUsersDto extends PaginationDto {
  @ApiPropertyOptional({ description: '用户名/昵称搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
