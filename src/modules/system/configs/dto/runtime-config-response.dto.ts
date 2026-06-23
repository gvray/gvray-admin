import { ApiProperty } from '@nestjs/swagger';

// ==================== 动态计算：系统能力 ====================

export class RuntimeCapabilitiesDto {
  @ApiProperty({ description: '已注册用户总数', example: 22, type: 'integer' })
  totalUsers!: number;

  @ApiProperty({ description: '可用角色数', example: 3, type: 'integer' })
  totalRoles!: number;

  @ApiProperty({ description: '权限总数', example: 56, type: 'integer' })
  totalPermissions!: number;
}

// ==================== 顶层响应（动态分组）====================

export class RuntimeConfigResponseDto {
  @ApiProperty({
    description: '系统能力（动态计算）',
    type: RuntimeCapabilitiesDto,
  })
  capabilities!: RuntimeCapabilitiesDto;

  // 所有来自 config 表的分组均为动态聚合，按 isPublic 字段控制可见性
  [group: string]: any;
}
