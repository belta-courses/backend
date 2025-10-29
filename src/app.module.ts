import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MailService } from './mail/mail.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageController } from './storage/storage.controller';
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';
import { PrismaService } from './prisma.service';
import appConfig from './config/app.config';
import { publicPath } from './config/constants.config';
import databaseConfig from './config/database.config';
import s3Config from './config/s3.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import { joiSchema } from './config/joi.schema';

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
    UsersModule,
    AuthModule,
    StorageModule,
  ],
  controllers: [AppController, StorageController],
  providers: [AppService, MailService, PrismaService, StorageService],
})
export class AppModule {}
