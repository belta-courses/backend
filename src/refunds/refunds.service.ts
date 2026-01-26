import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { StripeService } from 'src/stripe/stripe.service';
import { RefundRequestDto } from './dto/request/refund-request.dto';
import { ReviewRefundDto } from './dto/request/review-refund.dto';
import {
  Refund,
  RefundStatus,
  Transaction,
  TransactionStatus,
} from 'src/generated/prisma/client';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService,
  ) {}

  async requestRefund(
    transactionId: string,
    studentId: string,
    dto: RefundRequestDto,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { refund: true, course: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.studentId !== studentId) {
      throw new BadRequestException(
        'You can only request refund for your own transactions',
      );
    }

    if (transaction.status !== TransactionStatus.completed) {
      throw new BadRequestException(
        'Refund can only be requested for completed transactions',
      );
    }

    if (transaction.refund) {
      throw new BadRequestException(
        'Refund request already exists for this transaction',
      );
    }

    return this.prisma.refund.create({
      data: {
        transactionId,
        userId: studentId,
        courseId: transaction.courseId,
        message: dto.message,
        status: RefundStatus.waiting,
      },
      include: {
        transaction: true,
      },
    });
  }

  async reviewRefund(refundId: string, dto: ReviewRefundDto) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        transaction: true,
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }

    if (refund.status !== RefundStatus.waiting) {
      throw new BadRequestException('Refund request has already been reviewed');
    }

    if (dto.status === RefundStatus.rejected && !dto.response) {
      throw new BadRequestException(
        'Response is required when rejecting a refund',
      );
    }

    if (dto.status === RefundStatus.approved) {
      return this.approveRefund(refund, dto);
    } else {
      return this.rejectRefund(refund, dto);
    }
  }

  private async approveRefund(
    refund: Refund & { transaction: Transaction },
    dto: ReviewRefundDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = refund.transaction;

      // Process Stripe refund if payment was made via Stripe
      if (transaction.stripePaymentId) {
        try {
          // Check if it's a checkout session ID (starts with cs_) or payment intent ID (starts with pi_)
          if (transaction.stripePaymentId.startsWith('cs_')) {
            // It's a checkout session, retrieve it to get the payment intent
            const session = await this.stripeService.retrieveCheckoutSession(
              transaction.stripePaymentId,
            );
            if (
              session.payment_intent &&
              typeof session.payment_intent === 'string'
            ) {
              await this.stripeService.createRefund(
                session.payment_intent,
                transaction.paidPrice.toNumber(),
              );
            }
          } else {
            // It's a payment intent ID (legacy support)
            await this.stripeService.createRefund(
              transaction.stripePaymentId,
              transaction.paidPrice.toNumber(),
            );
          }
        } catch (error) {
          // Log error but continue with wallet refund
          console.error('Stripe refund failed:', error);
        }
      }

      // Add paid amount back to student wallet
      if (transaction.paidPrice.greaterThan(0)) {
        await this.walletService.addToWallet(
          transaction.studentId,
          transaction.paidPrice,
        );
      }

      // Remove profit from teacher wallet
      if (transaction.teacherProfit.greaterThan(0)) {
        await this.walletService.deductFromWallet(
          transaction.teacherId,
          transaction.teacherProfit,
        );
      }

      // Remove course ownership
      if (transaction.courseId) {
        await tx.ownedList.deleteMany({
          where: {
            studentId: transaction.studentId,
            courseId: transaction.courseId,
          },
        });
      }

      // Update refund status
      return tx.refund.update({
        where: { id: refund.id },
        data: {
          status: dto.status,
          reviewedAt: new Date(),
          response: dto.response,
        },
        include: {
          transaction: true,
        },
      });
    });
  }

  private async rejectRefund(refund: Refund, dto: ReviewRefundDto) {
    return this.prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: dto.status,
        reviewedAt: new Date(),
        response: dto.response,
      },
      include: {
        transaction: true,
      },
    });
  }

  async findAllRefunds({ page, limit }: PaginationDto) {
    const [refunds, total] = await this.prisma.$transaction([
      this.prisma.refund.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            include: {
              student: true,
              teacher: true,
              course: true,
            },
          },
        },
      }),
      this.prisma.refund.count(),
    ]);

    return {
      data: refunds,
      meta: {
        page,
        limit,
        count: refunds.length,
        total,
      },
    };
  }

  async findRefundById(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        transaction: {
          include: {
            student: true,
            teacher: true,
            course: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return refund;
  }
}
