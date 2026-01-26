import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { StripeService } from 'src/stripe/stripe.service';
import { SettingsService } from 'src/settings/settings.service';
import { AllConfig } from 'src/core/config/config.type';
import { Decimal } from '@prisma/client/runtime/client';
import { CreatePayoutDto } from './dto/request/create-payout.dto';
import { GetPayoutHistoryQueryDto } from './dto/request/get-payout-hestory-query.dto';
import { AddBankAccountDto } from './dto/request/add-bank-account.dto';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService<AllConfig>,
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

    // Get or create bank account token
    let bankAccountToken = user.stripeAccountId; // Repurposed field stores bank account token ID

    if (!bankAccountToken && !dto.bankAccount) {
      throw new BadRequestException({
        message: 'Bank account is required for payouts',
        requiresBankAccount: true,
      });
    }

    // If bank account provided in request, create token
    if (dto.bankAccount && !bankAccountToken) {
      const token = await this.stripeService.createBankAccountToken({
        accountNumber: dto.bankAccount.accountNumber,
        routingNumber: dto.bankAccount.routingNumber,
        accountHolderName: dto.bankAccount.accountHolderName,
        accountHolderType: dto.bankAccount.accountHolderType,
        country: dto.bankAccount.country,
        currency,
      });

      bankAccountToken = token.id;

      // Extract bank account info from token response
      const bankAccount = token.bank_account;
      const last4 = bankAccount?.last4 ?? null;
      const accountType = bankAccount?.account_type ?? null;

      // Save bank account info to user
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeAccountId: token.id, // Store token ID
          ...(last4 && { bankAccountLast4: last4 }),
          ...(accountType && { bankAccountType: accountType }),
        },
      });
    }

    if (!bankAccountToken) {
      throw new BadRequestException('Bank account token is required');
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

      // Create payout to bank account
      try {
        const payout = await this.stripeService.createPayout({
          amount: amount.toNumber(),
          currency: currency.toLowerCase(),
          destination: bankAccountToken,
          metadata: {
            withdrawId: withdraw.id,
            userId,
          },
          method: 'standard', // or 'instant' for faster (higher fees)
        });

        return {
          withdrawId: withdraw.id,
          payoutId: payout.id,
          amount: amount.toNumber(),
          currency,
          status: payout.status,
          arrivalDate: payout.arrival_date,
        };
      } catch (error) {
        // Log the actual error for debugging
        console.error('Stripe payout error:', error);

        await tx.withdraw.update({
          where: { id: withdraw.id },
          data: { failedAt: new Date() },
        });
        await this.walletService.addToWallet(userId, amount);

        // Provide more specific error message
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        throw new BadRequestException(
          `Failed to process payout: ${errorMessage}. Please verify your bank account details.`,
        );
      }
    });
  }

  async addBankAccount(userId: string, dto: AddBankAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currency = await this.settingsService.getCurrency();

    const token = await this.stripeService.createBankAccountToken({
      accountNumber: dto.accountNumber,
      routingNumber: dto.routingNumber,
      accountHolderName: dto.accountHolderName,
      accountHolderType: dto.accountHolderType,
      country: dto.country,
      currency,
    });

    // Extract bank account info from token response
    const bankAccount = token.bank_account;
    const last4 = bankAccount?.last4 ?? null;
    const accountType = bankAccount?.account_type ?? null;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeAccountId: token.id,
        ...(last4 && { bankAccountLast4: last4 }),
        ...(accountType && { bankAccountType: accountType }),
      },
    });

    return {
      message: 'Bank account added successfully',
      tokenId: token.id,
      last4,
      accountType,
    };
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
