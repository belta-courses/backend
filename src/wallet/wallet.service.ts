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
import {
  Role,
  User,
  Withdraw,
  WithdrawStatus,
} from 'src/generated/prisma/client';
import { PayPalService } from 'src/paypal/paypal.service';
import { CreateWithdrawDto } from './dto/request/create-withdraw.dto';
import { FindWithdrawsQueryDto } from './dto/request/find-withdraws-query.dto';
import { MailService } from 'src/mail/mail.service';
import {
  getPayPalErrorMessage,
  getUnclaimedInstructions,
} from 'src/paypal/utils/paypal-error-messages';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly paypalService: PayPalService,
    private readonly mailService: MailService,
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

  private generatePublicPayoutId() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timeLetters = new Date().getTime().toString(36).toUpperCase();
    return `PAYOUT-${timeLetters}-${random}`;
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

    if (wallet.amount.lessThan(dto.amount)) {
      throw new BadRequestException(
        `Your current balance is $${wallet.amount.toString()}. You cannot withdraw more than your balance.`,
      );
    }

    const initialAmmount = wallet.amount;
    const amountDecimal = new Decimal(dto.amount);

    let withdrawalId: string;

    // Create withdrawal and process PayPal payout in a transaction
    return await this.prisma.$transaction(async (tx) => {
      try {
        const payoutId = this.generatePublicPayoutId();
        const payoutResult = await this.paypalService.createPayout({
          email: dto.paypalEmail,
          amount: amountDecimal.toNumber(),
          senderBatchId: payoutId,
          note: `Withdrawal from wallet - ${payoutId}`,
        });

        const withdrawal = await tx.withdraw.create({
          data: {
            userId,
            amount: amountDecimal,
            paypalEmail: dto.paypalEmail,
            status: WithdrawStatus.pending,
            payoutId,
            paypalBatchId: payoutResult.batchId,
            paypalItemId: payoutResult.payoutItemId,
          },
        });

        withdrawalId = withdrawal.id;

        const withdrawHistory = await tx.withdrawHistory.create({
          data: {
            withdrawId: withdrawal.id,
            status: withdrawal.status,
          },
        });

        // Deduct amount from wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            amount: {
              decrement: amountDecimal,
            },
          },
        });

        return { ...withdrawal, histories: [withdrawHistory] };
      } catch (ignore) {
        if (withdrawalId) {
          await tx.withdraw.update({
            where: { id: withdrawalId },
            data: {
              status: WithdrawStatus.failed,
            },
          });
          await tx.withdrawHistory.create({
            data: {
              withdrawId: withdrawalId,
              status: WithdrawStatus.failed,
              note: `Withdrawal failed`,
            },
          });
        }
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            amount: initialAmmount,
          },
        });
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
        include: {
          histories: {
            orderBy: { createdAt: 'desc' },
          },
        },
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
      include: {
        histories: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }

  async updateWithdrawalStatus(
    paypalBatchId: string,
    status: WithdrawStatus,
    error?: { name: string; message: string },
  ) {
    const withdrawal = await this.prisma.withdraw.findUnique({
      where: { paypalBatchId },
      include: { user: true },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    await this.prisma.withdraw.update({
      where: { id: withdrawal.id },
      data: {
        status,
      },
    });

    const errorMessage = error
      ? getPayPalErrorMessage(error.name, error.message)
      : undefined;

    await this.prisma.withdrawHistory.create({
      data: {
        withdrawId: withdrawal.id,
        status,
        note: errorMessage,
      },
    });

    await this.sendWithdrawalEmail(withdrawal, status, error);
  }

  private async sendWithdrawalEmail(
    withdrawal: Withdraw & { user: User },
    status: WithdrawStatus,
    error?: { name: string; message: string },
  ) {
    const teacherName = withdrawal.user.name || 'Teacher';
    const amount = withdrawal.amount.toString();
    const withdrawalId = withdrawal.payoutId;

    const errorMessage = error
      ? getPayPalErrorMessage(error.name, error.message)
      : '';

    switch (status) {
      case WithdrawStatus.unclaimed: {
        const instructions = getUnclaimedInstructions(error?.name);
        await this.mailService.sendTemplate({
          name: 'withdrawal-unclaimed',
          to: withdrawal.user.email,
          data: {
            teacherName,
            amount,
            paypalEmail: withdrawal.paypalEmail,
            withdrawalId,
            errorMessage: errorMessage,
            instructions,
          },
        });
        break;
      }

      case WithdrawStatus.completed:
        await this.mailService.sendTemplate({
          name: 'withdrawal-completed',
          to: withdrawal.user.email,
          data: {
            teacherName,
            amount,
            paypalEmail: withdrawal.paypalEmail,
            withdrawalId,
            processedAt: withdrawal.updatedAt.toLocaleString(),
          },
        });
        break;

      case WithdrawStatus.failed:
        await this.mailService.sendTemplate({
          name: 'withdrawal-failed',
          to: withdrawal.user.email,
          data: {
            teacherName,
            amount,
            paypalEmail: withdrawal.paypalEmail,
            withdrawalId,
            failureReason: errorMessage,
          },
        });
        break;
    }
  }
}
