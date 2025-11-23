import { registerAs } from '@nestjs/config';
import { AppConfig } from './config.type';
import { PORT } from '../constants/paths.constants';

export default registerAs<AppConfig>('app', () => ({
  nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
  hostUrl: process.env.HOST_URL ?? `http://localhost:${PORT}`,
}));
