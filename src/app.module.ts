import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MailService } from './mail/mail.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { publicPath } from './lib/utils/path';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageController } from './storage/storage.controller';
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: publicPath,
    }),
    UsersModule,
    AuthModule,
    StorageModule,
  ],
  controllers: [AppController, StorageController],
  providers: [AppService, MailService, StorageService],
})
export class AppModule {}
