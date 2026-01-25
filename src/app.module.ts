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
import { publicPath } from './core/constants/paths.constants';
import databaseConfig from './core/config/database.config';
import s3Config from './core/config/s3.config';
import jwtConfig from './core/config/jwt.config';
import mailConfig from './core/config/mail.config';
import { joiSchema } from './core/config/joi.schema';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { Router } from './core/router';
import { CoursesModule } from './courses/courses.module';
import { WalletModule } from './wallet/wallet.module';

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
      route: Router.Integrated.MqBoard,
      adapter: ExpressAdapter,
    }),

    StorageModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService, PrismaService],
})
export class AppModule {}
