import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe.webhook.controller';
import { AllConfig } from 'src/core/config/config.type';
import { PurchasesModule } from 'src/purchases/purchases.module';

@Module({
  imports: [ConfigModule],
  providers: [
    StripeService,
    {
      provide: 'STRIPE_API_KEY',
      useFactory: (configService: ConfigService<AllConfig>) => {
        const api = configService.getOrThrow('stripe.apiKey', {
          infer: true,
        });
        return api;
      },
      inject: [ConfigService],
    },
  ],
  exports: [StripeService],
})
export class StripeModule {
  static forRootAsync(): DynamicModule {
    return {
      module: StripeModule,
      controllers: [StripeWebhookController],
      imports: [ConfigModule, forwardRef(() => PurchasesModule), StripeModule],
      providers: [],
      exports: [],
    };
  }
}
