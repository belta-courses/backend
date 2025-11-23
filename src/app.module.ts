import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MailService } from './mail/mail.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { PrismaService } from './prisma.service';
import appConfig from './core/config/app.config';
import { publicPath } from './core/config/constants.config';
import databaseConfig from './core/config/database.config';
import s3Config from './core/config/s3.config';
import jwtConfig from './core/config/jwt.config';
import mailConfig from './core/config/mail.config';
import { joiSchema } from './core/config/joi.schema';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, s3Config, jwtConfig, mailConfig],
      validationSchema: joiSchema,
    }),
    ServeStaticModule.forRoot({
      rootPath: publicPath,
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),

    UsersModule,
    AuthModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService, PrismaService],
})
export class AppModule {}
