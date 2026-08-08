import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class CacheKeyInfoDto {
  @ApiProperty({ description: '缓存 key', example: 'sys:dict:items:gender' })
  key: string;

  @ApiProperty({ description: 'Redis 数据类型', example: 'string' })
  type: string;

  @ApiProperty({
    description: '剩余 TTL（秒），-1 表示永不过期，-2 表示不存在',
    example: 1723,
  })
  ttl: number;

  @ApiProperty({
    description: 'value 序列化后的字节大小（仅 String 类型）',
    example: 256,
    required: false,
  })
  size?: number;
}

export class CacheKeyValueDto {
  @ApiProperty({ description: '缓存 key', example: 'sys:dict:items:gender' })
  key: string;

  @ApiProperty({ description: '剩余 TTL（秒）', example: 1723 })
  ttl: number;

  @ApiProperty({
    description: '缓存值（JSON 反序列化后）',
    example: [{ value: '1', label: '男' }],
  })
  value: unknown;
}

export class CacheClearResultDto {
  @ApiProperty({ description: '本次清理的 key 数量', example: 12 })
  deleted: number;
}

export class CacheKeyListResponseDto {
  @ApiProperty({ description: '缓存 key 列表', type: [CacheKeyInfoDto] })
  items: CacheKeyInfoDto[];

  @ApiProperty({ description: '总数量', example: 128 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 20 })
  pageSize: number;
}

/**
 * 缓存 key 列表查询 DTO
 */
export class CacheKeyQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'key 匹配模式，如 sys:dict:*',
    example: 'sys:dict:*',
  })
  @IsString({ message: '匹配模式必须是字符串' })
  @IsNotEmpty({ message: '匹配模式不能为空' })
  pattern: string;
}
