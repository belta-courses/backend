import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { version } from '../package.json';
import { Router } from './core/router';
import { PORT } from './core/constants/paths.constants';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  // IMPORTANT: Configure body parsers BEFORE other middleware
  // Use raw body parser for webhook route (must come first)
  app.use('/stripe/webhook', raw({ type: 'application/json' }));

  // Use JSON parser for all other routes
  app.use(json());

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
      Router.Integrated.ApiAuthName,
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(Router.Integrated.SwaggerRoute, app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown fields
      forbidNonWhitelisted: true, // Throw error if unknown fields exist
      transform: false, // 👈 Enables auto type conversion
      transformOptions: { enableImplicitConversion: false }, // 👈 Allows @Type() to work
    }),
  );

  await app.listen(PORT);
}
void bootstrap();
