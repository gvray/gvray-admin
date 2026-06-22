import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ProfileResponseDto {
  @ApiProperty({ description: '用户唯一标识符（UUID）' })
  @Expose()
  userId: string;

  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: '昵称' })
  @Expose()
  nickname: string;

  @ApiPropertyOptional({ description: '头像' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  avatar?: string | null;

  @ApiPropertyOptional({ description: '邮箱' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  email?: string | null;

  @ApiPropertyOptional({ description: '手机号码' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  phone?: string | null;

  @ApiPropertyOptional({ description: '性别' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  gender?: string | null;

  @ApiProperty({ description: '更新时间', type: 'string', format: 'date-time' })
  @Expose()
  updatedAt: Date;
}
