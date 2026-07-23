import { ApiProperty } from '@nestjs/swagger';

export class CacheStatsDto {
  @ApiProperty({ description: '缓存命中次数', example: 1280 })
  hits: number;

  @ApiProperty({ description: '缓存未命中次数', example: 45 })
  misses: number;

  @ApiProperty({ description: '缓存清理次数', example: 12 })
  evictions: number;

  @ApiProperty({ description: '命中率（0-1）', example: 0.966 })
  hitRate: number;

  @ApiProperty({ description: 'Redis 总 key 数量', example: 256 })
  totalKeys: number;

  @ApiProperty({ description: 'Redis 已用内存（字节）', example: 1048576 })
  usedMemory: number;

  @ApiProperty({ description: 'Redis 是否可用', example: true })
  redisAvailable: boolean;
}
