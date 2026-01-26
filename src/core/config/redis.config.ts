import { registerAs } from '@nestjs/config';
import { RedisConfig } from './config.type';

export default registerAs<RedisConfig>('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
}));
