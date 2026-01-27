import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindWalletsQueryDto } from './dto/request/find-wallets-query.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { UsersService } from 'src/users/users.service';
import { Role, Withdraw, WithdrawStatus } from 'src/generated/prisma/client';
import { PayPalService } from 'src/paypal/paypal.service';
import { CreateWithdrawDto } from './dto/request/create-withdraw.dto';
import { FindWithdrawsQueryDto } from './dto/request/find-withdraws-query.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly paypalService: PayPalService,
  ) {}

  private async ensureTeacher(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (user.role !== Role.teacher) {
      throw new ForbiddenException('Wallets are only available for teachers');
    }
  }

  async getOrCreateWallet(userId: string) {
    await this.ensureTeacher(userId);

    let wallet = await this.prisma.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          amount: new Decimal(0),
        },
      });
    }

    return wallet;
  }

  async addToWallet(userId: string, amount: number | Decimal) {
    const wallet = await this.getOrCreateWallet(userId);
    const amountDecimal =
      amount instanceof Decimal ? amount : new Decimal(amount);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        amount: {
          increment: amountDecimal,
        },
      },
    });
  }

  async deductFromWallet(userId: string, amount: number | Decimal) {
    const wallet = await this.getOrCreateWallet(userId);
    const amountDecimal =
      amount instanceof Decimal ? amount : new Decimal(amount);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        amount: {
          decrement: amountDecimal,
        },
      },
    });
  }

  async findAllWallets(dto: FindWalletsQueryDto) {
    const { page, limit } = dto;

    const [wallets, totalCount] = await this.prisma.$transaction([
      this.prisma.wallet.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wallet.count(),
    ]);

    return {
      data: wallets,
      meta: {
        page: page,
        limit: limit,
        count: wallets.length,
        total: totalCount,
      },
    };
  }

  async requestWithdrawal(userId: string, dto: CreateWithdrawDto) {
    await this.ensureTeacher(userId);

    const wallet = await this.getOrCreateWallet(userId);
    const MINIMUM_WITHDRAWAL_AMOUNT = new Decimal(10);

    // Check if wallet has minimum withdrawal amount (10 USD)
    if (wallet.amount.lessThan(MINIMUM_WITHDRAWAL_AMOUNT)) {
      throw new BadRequestException(
        `Minimum withdrawal amount is $10 USD. Your current balance is $${wallet.amount.toString()}`,
      );
    }

    // User can only withdraw the full wallet balance
    const amountDecimal = wallet.amount;

    // Create withdrawal and process PayPal payout in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create withdrawal record
      const withdrawal = await tx.withdraw.create({
        data: {
          userId,
          amount: amountDecimal,
          paypalEmail: dto.paypalEmail,
          status: WithdrawStatus.pending,
        },
      });

      try {
        // Create PayPal payout with full wallet balance
        const payoutResult = await this.paypalService.createPayout({
          email: dto.paypalEmail,
          amount: amountDecimal.toNumber(),
          senderBatchId: `withdraw_${withdrawal.id}`,
          note: `Withdrawal from wallet - ${withdrawal.id}`,
        });

        // Update withdrawal with PayPal IDs
        const updatedWithdrawal = await tx.withdraw.update({
          where: { id: withdrawal.id },
          data: {
            paypalPayoutId: payoutResult.batchId,
            paypalPayoutItemId: payoutResult.payoutItemId,
            processedAt: new Date(),
            status:
              payoutResult.payoutItemStatus === 'SUCCESS'
                ? WithdrawStatus.completed
                : WithdrawStatus.pending,
          },
        });

        // Deduct amount from wallet only if payout was created successfully
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            amount: {
              decrement: amountDecimal,
            },
          },
        });

        return updatedWithdrawal;
      } catch (error) {
        // If PayPal payout fails, mark withdrawal as failed
        await tx.withdraw.update({
          where: { id: withdrawal.id },
          data: {
            status: WithdrawStatus.failed,
            failedAt: new Date(),
            failureReason:
              error instanceof Error ? error.message : 'PayPal payout failed',
          },
        });

        throw new BadRequestException(
          `Failed to process PayPal payout: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    });
  }

  async getWithdrawals(
    dto: FindWithdrawsQueryDto,
    userId?: string,
  ): Promise<{
    data: Withdraw[];
    meta: {
      page: number;
      limit: number;
      count: number;
      total: number;
    };
  }> {
    const { page, limit } = dto;

    const where = userId ? { userId } : {};

    const [withdrawals, totalCount] = await this.prisma.$transaction([
      this.prisma.withdraw.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdraw.count({ where }),
    ]);

    return {
      data: withdrawals,
      meta: {
        page: page,
        limit: limit,
        count: withdrawals.length,
        total: totalCount,
      },
    };
  }

  async getWithdrawalById(withdrawalId: string) {
    const withdrawal = await this.prisma.withdraw.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }

  async updateWithdrawalStatus(
    payoutItemId: string,
    status: WithdrawStatus,
    failureReason?: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdraw.findFirst({
        where: { paypalPayoutItemId: payoutItemId },
      });

      if (!withdrawal) {
        console.warn(
          `Withdrawal not found for payout item ID: ${payoutItemId}`,
        );
        return null;
      }

      // If status hasn't changed, no need to update
      if (withdrawal.status === status) {
        console.log(
          `Withdrawal ${withdrawal.id} already has status ${status}, skipping update`,
        );
        return withdrawal;
      }

      const updateData: {
        status: WithdrawStatus;
        processedAt?: Date;
        failedAt?: Date;
        failureReason?: string;
      } = {
        status,
      };

      // Handle status-specific updates
      if (status === WithdrawStatus.completed) {
        updateData.processedAt = new Date();
      } else if (status === WithdrawStatus.failed) {
        updateData.failedAt = new Date();
        if (failureReason) {
          updateData.failureReason = failureReason;
        }

        // Refund money back to wallet if payout failed
        // Only refund if withdrawal was previously pending or completed
        // (not if it was already failed to avoid double refunds)
        if (
          withdrawal.status === WithdrawStatus.pending ||
          withdrawal.status === WithdrawStatus.completed
        ) {
          const wallet = await this.getOrCreateWallet(withdrawal.userId);
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              amount: {
                increment: withdrawal.amount,
              },
            },
          });
          console.log(
            `Refunded ${withdrawal.amount.toString()} back to wallet for failed withdrawal ${withdrawal.id}`,
          );
        }
      }

      return await tx.withdraw.update({
        where: { id: withdrawal.id },
        data: updateData,
      });
    });
  }
}
