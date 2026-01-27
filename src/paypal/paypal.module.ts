import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PayPalService } from './paypal.service';
import { PayPalWebhookController } from './paypal.webhook.controller';
import { AllConfig } from 'src/core/config/config.type';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [ConfigModule],
  providers: [
    PayPalService,
    {
      provide: 'PAYPAL_CLIENT_ID',
      useFactory: (configService: ConfigService<AllConfig>) => {
        const clientId = configService.getOrThrow('paypal.clientId', {
          infer: true,
        });
        return clientId;
      },
      inject: [ConfigService],
    },
    {
      provide: 'PAYPAL_CLIENT_SECRET',
      useFactory: (configService: ConfigService<AllConfig>) => {
        const clientSecret = configService.getOrThrow('paypal.clientSecret', {
          infer: true,
        });
        return clientSecret;
      },
      inject: [ConfigService],
    },
    {
      provide: 'PAYPAL_MODE',
      useFactory: (configService: ConfigService<AllConfig>) => {
        const mode = configService.getOrThrow('paypal.mode', {
          infer: true,
        });
        return mode;
      },
      inject: [ConfigService],
    },
  ],
  exports: [PayPalService],
})
export class PayPalModule {
  static forRootAsync(): DynamicModule {
    return {
      module: PayPalModule,
      controllers: [PayPalWebhookController],
      imports: [ConfigModule, forwardRef(() => WalletModule), PayPalModule],
      providers: [],
      exports: [],
    };
  }
}
