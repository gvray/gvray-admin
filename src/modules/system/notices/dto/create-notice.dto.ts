import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateNoticeDto {
  @ApiProperty({ description: '标题' })
  @IsString({ message: '标题必须是字符串' })
  title: string;

  @ApiProperty({ description: '内容' })
  @IsString({ message: '内容必须是字符串' })
  content: string;

  @ApiPropertyOptional({
    description: '类型：notice-通知, announcement-通告',
    default: 'notice',
  })
  @IsOptional()
  @IsString({ message: '类型必须是字符串' })
  type?: string = 'notice';

  @ApiPropertyOptional({
    description: '状态：disabled-禁用, enabled-启用',
    default: 'enabled',
  })
  @IsOptional()
  @IsString({ message: '状态必须是字符串' })
  status?: string = 'enabled';

  @ApiPropertyOptional({ description: '排序权重', default: 0, type: 'integer' })
  @IsOptional()
  @IsInt({ message: '排序权重必须是整数' })
  @Min(0, { message: '排序权重不能小于0' })
  sort?: number = 0;
}
