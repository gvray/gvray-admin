import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '用户名/邮箱/手机号', example: 'admin' })
  @IsString({ message: '用户名/邮箱/手机号必须是字符串' })
  account: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;
}
