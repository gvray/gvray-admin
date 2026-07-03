import { registerAs } from '@nestjs/config';

export class CorsConfig {
  enabled!: boolean;
  origins!: string;
}

export default registerAs('cors', (): CorsConfig => ({
  enabled: process.env.ENABLE_CORS === 'true',
  origins: process.env.CORS_ORIGINS || '',
}));
