import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { PrismaService } from 'src/prisma.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { StripeModule } from 'src/stripe/stripe.module';
import { SettingsModule } from 'src/settings/settings.module';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [WalletModule, StripeModule, SettingsModule],
  controllers: [RefundsController],
  providers: [RefundsService, PrismaService, MailService],
})
export class RefundsModule {}
