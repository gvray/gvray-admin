import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class AuthMenuResponseDto {
  @ApiProperty({ description: '菜单唯一标识符（UUID）' })
  @Expose()
  menuId: string;

  @ApiPropertyOptional({ description: '父级菜单ID' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  parentMenuId?: string | null;

  @ApiProperty({ description: '菜单名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '菜单类型' })
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

  @ApiPropertyOptional({ description: '子节点', type: [AuthMenuResponseDto] })
  @Expose()
  @Type(() => AuthMenuResponseDto)
  children?: AuthMenuResponseDto[];
}
