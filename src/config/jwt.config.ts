import { registerAs } from '@nestjs/config';

export class JwtConfig {
  secret!: string;
  accessTokenExpiresIn!: string;
  refreshTokenExpiresIn!: string;
}

export default registerAs('jwt', (): JwtConfig => ({
  secret: process.env.JWT_SECRET!,
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '2h',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
}));
