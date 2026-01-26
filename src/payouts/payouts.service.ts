import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { StripeService } from 'src/stripe/stripe.service';
import { SettingsService } from 'src/settings/settings.service';
import { Decimal } from '@prisma/client/runtime/client';
import { CreatePayoutDto } from './dto/request/create-payout.dto';
import { GetPayoutHistoryQueryDto } from './dto/request/get-payout-hestory-query.dto';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService,
    private readonly settingsService: SettingsService,
  ) {}

  async createPayout(userId: string, dto: CreatePayoutDto) {
    const wallet = await this.walletService.getOrCreateWallet(userId);
    const amount = new Decimal(dto.amount);

    if (wallet.amount.lessThan(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currency = await this.settingsService.getCurrency();

    // Check if user has Stripe Connect account
    let { stripeAccountId } = user;

    if (!stripeAccountId) {
      // Create Stripe Connect account
      const account = await this.stripeService.createConnectAccount(user.email);
      stripeAccountId = account.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: account.id },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await this.walletService.deductFromWallet(userId, amount);

      // Create withdraw record
      const withdraw = await tx.withdraw.create({
        data: {
          userId,
          amount,
          createdAt: new Date(),
        },
      });

      // Create transfer to Stripe Connect account
      try {
        const transfer = await this.stripeService.createTransfer({
          amount: amount.toNumber(),
          currency: currency.toLowerCase(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          destination: stripeAccountId,
          metadata: {
            withdrawId: withdraw.id,
            userId,
          },
        });

        return {
          withdrawId: withdraw.id,
          transferId: transfer.id,
          amount: amount.toNumber(),
          currency,
        };
      } catch (ignore) {
        await tx.withdraw.update({
          where: { id: withdraw.id },
          data: { failedAt: new Date() },
        });
        await this.walletService.addToWallet(userId, amount);
        throw new BadRequestException(
          'Failed to process payout. Please ensure your Stripe Connect account is properly set up.',
        );
      }
    });
  }

  async getPayoutHistory({ userId, page, limit }: GetPayoutHistoryQueryDto) {
    const [withdraws, total] = await this.prisma.$transaction([
      this.prisma.withdraw.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdraw.count({ where: { userId } }),
    ]);

    return {
      data: withdraws,
      meta: {
        page,
        limit,
        count: withdraws.length,
        total,
      },
    };
  }
}
