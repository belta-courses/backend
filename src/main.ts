import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { jwtAuthName, PORT } from './core/config/constants.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { version } from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Belta Courses API')
    .setDescription('Belta Courses API description')
    .setVersion(version)
    .addTag('belta-courses')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      jwtAuthName,
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(PORT);
}
void bootstrap();
