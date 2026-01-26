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
import stripeConfig from './core/config/stripe.config';
import redisConfig from './core/config/redis.config';
import { RedisConfig } from './core/config/config.type';
import { joiSchema } from './core/config/joi.schema';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { ConfigService } from '@nestjs/config';
import { Router } from './core/router';
import { CoursesModule } from './courses/courses.module';
import { WalletModule } from './wallet/wallet.module';
import { SettingsModule } from './settings/settings.module';
import { StripeModule } from './stripe/stripe.module';
import { PurchasesModule } from './purchases/purchases.module';
import { RefundsModule } from './refunds/refunds.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        s3Config,
        jwtConfig,
        mailConfig,
        stripeConfig,
        redisConfig,
      ],
      validationSchema: joiSchema,
    }),
    ServeStaticModule.forRoot({
      rootPath: publicPath,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redis = configService.get<RedisConfig>('redis')!;
        return {
          connection: {
            host: redis.host,
            port: redis.port,
            ...(redis.username && { username: redis.username }),
            ...(redis.password && { password: redis.password }),
            ...(redis.db !== undefined && { db: redis.db }),
            ...(redis.tls && { tls: redis.tls }),
          },
        };
      },
    }),
    BullBoardModule.forRoot({
      route: Router.Integrated.MqBoard,
      adapter: ExpressAdapter,
    }),
    StripeModule.forRootAsync(),

    StorageModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    WalletModule,
    SettingsModule,
    PurchasesModule,
    RefundsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService, PrismaService],
})
export class AppModule {}
