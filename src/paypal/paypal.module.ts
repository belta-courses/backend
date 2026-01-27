import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PayPalService } from './paypal.service';
import { PayPalWebhookController } from './paypal.webhook.controller';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [ConfigModule, forwardRef(() => WalletModule)],
  controllers: [PayPalWebhookController],
  providers: [PayPalService],
  exports: [PayPalService],
})
export class PayPalModule {}
