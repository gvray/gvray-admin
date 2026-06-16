import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationSortDto } from '@/shared/dtos/pagination.dto';
import { MenuType } from './create-menu.dto';

export class QueryMenuDto extends PaginationSortDto {
  @ApiPropertyOptional({ description: '菜单名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '菜单路径' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: '菜单类型', enum: MenuType })
  @IsOptional()
  @IsEnum(MenuType)
  type?: MenuType;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '父菜单ID' })
  @IsOptional()
  @IsString()
  parentMenuId?: string;

  @ApiPropertyOptional({ description: '创建时间开始（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({ description: '创建时间结束（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtEnd?: string;
}
