import { Module, forwardRef } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { PrismaService } from 'src/prisma.service';
import { StripeModule } from 'src/stripe/stripe.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { SettingsModule } from 'src/settings/settings.module';
import { CoursesModule } from 'src/courses/courses.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => StripeModule),
    WalletModule,
    SettingsModule,
    CoursesModule,
    UsersModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService, PrismaService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
