import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './lib/config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
}
void bootstrap();
