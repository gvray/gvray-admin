import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class QueryRoleTemplateDto extends PaginationDto {
  @ApiPropertyOptional({ description: '模板名称' })
  @IsOptional()
  @IsString()
  name?: string;
}
