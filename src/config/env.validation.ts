import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsInt()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TOKEN_EXPIRES_IN: string = '5m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_TOKEN_EXPIRES_IN: string = '7d';

  @IsBoolean()
  @IsOptional()
  ENABLE_CORS: boolean = true;

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = '';

  @IsString()
  @IsOptional()
  APP_TZ_SUFFIX: string = '+08:00';

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsInt()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string = '';

  @IsInt()
  @IsOptional()
  REDIS_DB: number = 0;

  @IsBoolean()
  @IsOptional()
  OPLOG_ENABLED: boolean = true;

  @IsString()
  @IsOptional()
  OPLOG_MASK_FIELDS: string =
    'password,oldPassword,newPassword,token,authorization,secret,captcha';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
