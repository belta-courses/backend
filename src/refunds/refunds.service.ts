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
import { MailService } from 'src/mail/mail.service';
import { SettingsService } from 'src/settings/settings.service';

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly stripeService: StripeService,
    private readonly mailService: MailService,
    private readonly settingsService: SettingsService,
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
    const approvedRefund = await this.prisma.$transaction(async (tx) => {
      const transaction = refund.transaction;

      // Process Stripe refund if payment was made via Stripe
      // Students get refunded directly by Stripe, no wallet needed
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
          // Log error
          console.error('Stripe refund failed:', error);
          throw error; // Re-throw to prevent marking refund as approved if Stripe refund fails
        }
      }

      // Remove profit from teacher wallet (teachers have wallets)
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
          transaction: {
            include: {
              course: {
                include: {
                  teacher: true,
                },
              },
              student: true,
            },
          },
        },
      });
    });

    // Send refund invoice email
    await this.sendRefundInvoice(approvedRefund);

    return approvedRefund;
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

  private async sendRefundInvoice(
    refund: Refund & {
      transaction: Transaction & {
        course: {
          name: string;
          teacher: { name: string | null };
        } | null;
        student: { email: string; name: string | null };
      };
    },
  ) {
    if (!refund.transaction.course) {
      return; // Skip if no course
    }

    const currency = await this.settingsService.getCurrency();
    const studentName = refund.transaction.student.name || 'Student';
    const teacherName = refund.transaction.course.teacher.name || 'Instructor';
    const refundDate = refund.reviewedAt
      ? new Date(refund.reviewedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    try {
      await this.mailService.sendTemplate({
        to: refund.transaction.student.email,
        name: 'invoice-refund',
        data: {
          studentName,
          refundId: refund.id,
          transactionId: refund.transaction.id,
          refundDate,
          courseName: refund.transaction.course.name,
          teacherName,
          paidPrice: refund.transaction.paidPrice.toFixed(2),
          currency: currency.toUpperCase(),
        },
      });
    } catch (error) {
      // Log error but don't fail the refund if email fails
      console.error('Failed to send refund invoice email:', error);
    }
  }
}
