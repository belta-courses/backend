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

    // Get or create external account ID
    let externalAccountId = user.stripeAccountId; // Repurposed field stores external account ID (ba_*)

    if (!externalAccountId && !dto.bankAccount) {
      throw new BadRequestException({
        message: 'Bank account is required for payouts',
        requiresBankAccount: true,
      });
    }

    // If bank account provided in request, create external account
    if (dto.bankAccount && !externalAccountId) {
      // Step 1: Create bank account token
      const token = await this.stripeService.createBankAccountToken({
        accountNumber: dto.bankAccount.accountNumber,
        routingNumber: dto.bankAccount.routingNumber,
        accountHolderName: dto.bankAccount.accountHolderName,
        accountHolderType: dto.bankAccount.accountHolderType,
        country: dto.bankAccount.country,
        currency,
      });

      // Step 2: Get platform Stripe account ID
      const platformAccountId = await this.stripeService.getAccountId();

      // Step 3: Create external account from token
      const externalAccount = await this.stripeService.createExternalAccount({
        accountId: platformAccountId,
        bankAccountToken: token.id,
      });

      externalAccountId = externalAccount.id;

      // Extract bank account info from external account response
      // ExternalAccount can be BankAccount or Card, check if it's a bank account
      const last4 =
        externalAccount.object === 'bank_account'
          ? (externalAccount.last4 ?? null)
          : null;
      const accountType =
        externalAccount.object === 'bank_account'
          ? (externalAccount.account_type ?? null)
          : null;

      // Save external account ID to user
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeAccountId: externalAccountId, // Store external account ID (ba_*)
          ...(last4 && { bankAccountLast4: last4 }),
          ...(accountType && { bankAccountType: accountType }),
        },
      });
    }

    if (!externalAccountId) {
      throw new BadRequestException('External account ID is required');
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
          destination: externalAccountId, // Use external account ID (ba_*)
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

    // Step 1: Create bank account token
    const token = await this.stripeService.createBankAccountToken({
      accountNumber: dto.accountNumber,
      routingNumber: dto.routingNumber,
      accountHolderName: dto.accountHolderName,
      accountHolderType: dto.accountHolderType,
      country: dto.country,
      currency,
    });

    // Step 2: Get platform Stripe account ID
    const platformAccountId = await this.stripeService.getAccountId();

    // Step 3: Create external account from token
    const externalAccount = await this.stripeService.createExternalAccount({
      accountId: platformAccountId,
      bankAccountToken: token.id,
    });

    // Extract bank account info from external account response
    // ExternalAccount can be BankAccount or Card, check if it's a bank account
    const last4 =
      externalAccount.object === 'bank_account'
        ? (externalAccount.last4 ?? null)
        : null;
    const accountType =
      externalAccount.object === 'bank_account'
        ? (externalAccount.account_type ?? null)
        : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeAccountId: externalAccount.id, // Store external account ID (ba_*)
        ...(last4 && { bankAccountLast4: last4 }),
        ...(accountType && { bankAccountType: accountType }),
      },
    });

    return {
      message: 'Bank account added successfully',
      externalAccountId: externalAccount.id,
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
