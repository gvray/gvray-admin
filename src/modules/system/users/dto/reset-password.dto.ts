import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 50 })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(50, { message: '密码不能超过50个字符' })
  newPassword: string;
}
