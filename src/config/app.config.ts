import { registerAs } from '@nestjs/config';

export class AppConfig {
  port!: number;
  nodeEnv!: string;
  tzSuffix!: string;
  oLogEnabled!: boolean;
  oLogMaskFields!: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    tzSuffix: process.env.APP_TZ_SUFFIX || '+08:00',
    oLogEnabled: process.env.OPLOG_ENABLED !== 'false',
    oLogMaskFields:
      process.env.OPLOG_MASK_FIELDS ||
      'password,oldPassword,newPassword,token,authorization,secret,captcha',
  }),
);
