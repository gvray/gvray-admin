import { registerAs } from '@nestjs/config';

export const DEFAULT_OLOG_MASK_FIELDS =
  'password,oldPassword,newPassword,token,authorization,secret,captcha,email,phone,mobile,idCard,idCardNo,idNumber';

export class AppConfig {
  port!: number;
  nodeEnv!: string;
  tzSuffix!: string;
  oLogEnabled!: boolean;
  oLogMaskFields!: string;
  bcryptRounds!: number;
  geoIpTimeoutMs!: number;
  geoIpCacheTtlSeconds!: number;
  authCtxCacheTtl!: number;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    tzSuffix: process.env.APP_TZ_SUFFIX || '+08:00',
    oLogEnabled: process.env.OPLOG_ENABLED !== 'false',
    oLogMaskFields:
      process.env.OPLOG_MASK_FIELDS || DEFAULT_OLOG_MASK_FIELDS,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    geoIpTimeoutMs: parseInt(process.env.GEOIP_TIMEOUT_MS || '8000', 10),
    geoIpCacheTtlSeconds: parseInt(
      process.env.GEOIP_CACHE_TTL_SECONDS || '604800',
      10,
    ),
    authCtxCacheTtl: parseInt(
      process.env.AUTH_CTX_CACHE_TTL || '600',
      10,
    ),
  }),
);
