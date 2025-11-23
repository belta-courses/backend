import { registerAs } from '@nestjs/config';
import { JwtConfig } from './config.type';

export default registerAs<JwtConfig>('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'secret',
}));
