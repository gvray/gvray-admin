import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleTemplateResponseDto {
  @ApiProperty({ description: '模板ID' })
  @Expose()
  templateId: string;

  @ApiProperty({ description: '模板标识' })
  @Expose()
  templateKey: string;

  @ApiProperty({ description: '模板名称' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: '模板描述' })
  @Expose()
  description?: string;

  @ApiProperty({ description: '状态' })
  @Expose()
  status: string;

  @ApiProperty({ description: '排序权重' })
  @Expose()
  sort: number;

  @ApiPropertyOptional({ description: '备注' })
  @Expose()
  remark?: string;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;
}
