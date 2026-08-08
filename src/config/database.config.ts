import { registerAs } from '@nestjs/config';

export class DatabaseConfig {
  url!: string;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    url: process.env.DATABASE_URL!,
  }),
);
