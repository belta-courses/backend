import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { PrismaService } from 'src/prisma.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [WalletModule, StripeModule],
  controllers: [RefundsController],
  providers: [RefundsService, PrismaService],
})
export class RefundsModule {}
