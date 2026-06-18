import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class MenuResponseDto {
  @ApiProperty({ type: 'integer' })

  @Exclude()
  id: number;

  @ApiProperty({ description: '菜单唯一标识符（UUID）' })
  @Expose()
  menuId: string;

  @ApiProperty({ description: '菜单名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '菜单类型', enum: ['CATALOG', 'MENU'] })
  @Expose()
  type: string;

  @ApiPropertyOptional({ description: '绑定权限码' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  permissionCode?: string | null;

  @ApiPropertyOptional({ description: '菜单路径' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  path?: string | null;

  @ApiPropertyOptional({ description: '菜单图标' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  icon?: string | null;

  @ApiProperty({ description: '是否隐藏', type: 'boolean' })
  @Expose()
  hidden?: boolean;

  @ApiProperty({ description: '排序权重', type: 'integer' })
  @Expose()
  sort?: number;

  @ApiProperty({ description: '状态' })
  @Expose()
  status?: string;

  @ApiPropertyOptional({ description: '父菜单ID' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  parentMenuId?: string | null;

  @ApiProperty({ description: '创建时间', type: 'string', format: 'date-time' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间', type: 'string', format: 'date-time' })
  @Expose()
  updatedAt: Date;
}

export class MenuTreeNodeDto extends MenuResponseDto {
  @ApiPropertyOptional({
    description: '子菜单列表',
    type: () => [MenuTreeNodeDto],
  })
  @Expose()
  @Type(() => MenuTreeNodeDto)
  children?: MenuTreeNodeDto[];
}
