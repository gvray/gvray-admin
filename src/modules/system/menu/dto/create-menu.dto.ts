import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsInt } from 'class-validator';

export enum MenuType {
  CATALOG = 'CATALOG',
  MENU = 'MENU',
}

export class CreateMenuDto {
  @ApiProperty({ description: '菜单名称' })
  @IsString({ message: '菜单名称必须是字符串' })
  name: string;

  @ApiProperty({ description: '菜单类型', enum: MenuType })
  @IsEnum(MenuType, { message: '菜单类型必须是 CATALOG 或 MENU' })
  type: MenuType;

  @ApiPropertyOptional({ description: '绑定权限码，如 system:user:list' })
  @IsOptional()
  @IsString()
  permissionCode?: string;

  @ApiProperty({ description: '菜单路径（唯一）' })
  @IsString({ message: '菜单路径必须是字符串' })
  path: string;

  @ApiPropertyOptional({ description: '菜单图标' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '是否隐藏', type: 'boolean' })
  @IsOptional()
  hidden?: boolean;

  @ApiPropertyOptional({ description: '排序权重', type: 'integer' })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['enabled', 'disabled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '父级菜单ID' })
  @IsOptional()
  @IsString()
  parentMenuId?: string;
}
