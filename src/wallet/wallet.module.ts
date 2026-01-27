import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaService } from 'src/prisma.service';
import { PayPalModule } from 'src/paypal/paypal.module';
import { UsersModule } from 'src/users/users.module';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [PayPalModule, UsersModule],
  controllers: [WalletController],
  providers: [WalletService, PrismaService, MailService],
  exports: [WalletService],
})
export class WalletModule {}
