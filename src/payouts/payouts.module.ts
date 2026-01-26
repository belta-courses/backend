import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { PrismaService } from 'src/prisma.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [WalletModule, StripeModule, SettingsModule],
  controllers: [PayoutsController],
  providers: [PayoutsService, PrismaService],
})
export class PayoutsModule {}
