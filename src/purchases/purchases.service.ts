import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';
import { WalletService } from 'src/wallet/wallet.service';
import { SettingsService } from 'src/settings/settings.service';
import { CoursesService } from 'src/courses/courses.service';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { CourseStatus, TransactionStatus } from 'src/generated/prisma/client';
import { PurchaseCourseDto } from './dto/request/purchase-course.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly walletService: WalletService,
    private readonly settingsService: SettingsService,
    private readonly coursesService: CoursesService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService<AllConfig>,
  ) {}

  async initiatePurchase(
    courseId: string,
    studentId: string,
    dto: PurchaseCourseDto,
  ) {
    const course = await this.coursesService.findCourseById(courseId);

    if (course.status !== CourseStatus.published) {
      throw new BadRequestException('Course is not available for purchase');
    }

    // Check if student already owns the course
    const existingOwnership = await this.prisma.ownedList.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingOwnership) {
      throw new BadRequestException('You already own this course');
    }

    // Check for existing pending transaction
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        studentId,
        courseId,
        stripePaymentId: null, // Pending transaction
      },
    });

    if (existingTransaction) {
      throw new BadRequestException(
        'You have a pending purchase for this course',
      );
    }

    const currency = await this.settingsService.getCurrency();
    const teacherProfitPercent = await this.settingsService.getTeacherProfit();

    const originalPrice = course.price;
    const finalPrice = originalPrice; // Same for now, but kept separate for future discounts

    // Students don't have wallets - they pay directly via Stripe
    // Teachers have wallets but they're sellers, not buyers
    const walletAmountUsed = new Decimal(0);
    const paidPrice = finalPrice;

    // Calculate teacher profit
    const teacherProfit = paidPrice.times(new Decimal(teacherProfitPercent));

    // Students always pay via Stripe (no free purchases with wallet)
    // If price is 0, it's a free course - handle separately if needed
    if (paidPrice.equals(0)) {
      return this.completePurchaseWithoutStripe(
        courseId,
        studentId,
        course.teacherId,
        originalPrice,
        finalPrice,
        paidPrice,
        walletAmountUsed, // Always 0 for students
        teacherProfitPercent,
        teacherProfit,
        currency,
      );
    }

    // Get user email for Stripe Checkout
    const user = await this.usersService.findOne(studentId);

    // Get success and cancel URLs from request or fallback to config
    const successUrl =
      dto.successUrl ??
      this.configService.getOrThrow('stripe.checkoutSuccessUrl', {
        infer: true,
      });
    const cancelUrl =
      dto.cancelUrl ??
      this.configService.getOrThrow('stripe.checkoutCancelUrl', {
        infer: true,
      });

    // Create Stripe Checkout Session
    const checkoutSession = await this.stripeService.createCheckoutSession({
      amount: paidPrice.toNumber(),
      currency: currency.toLowerCase(),
      successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}`,
      cancelUrl: `${cancelUrl}?courseId=${courseId}`,
      metadata: {
        courseId,
        studentId,
        teacherId: course.teacherId,
        courseName: course.name,
      },
      customerEmail: user.email,
    });

    // Create pending transaction
    await this.prisma.transaction.create({
      data: {
        studentId,
        teacherId: course.teacherId,
        courseId,
        originalPrice,
        finalPrice,
        paidPrice,
        teacherProfitPercent: new Decimal(teacherProfitPercent),
        teacherProfit,
        stripePaymentId: checkoutSession.id, // Store session ID in stripePaymentId field
        status: TransactionStatus.pending,
      },
    });

    return {
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      amount: paidPrice.toNumber(),
      currency,
      walletAmountUsed: walletAmountUsed.toNumber(),
    };
  }

  async completePurchaseWithoutStripe(
    courseId: string,
    studentId: string,
    teacherId: string,
    originalPrice: Decimal,
    finalPrice: Decimal,
    paidPrice: Decimal,
    walletAmountUsed: Decimal,
    teacherProfitPercent: number,
    teacherProfit: Decimal,
    currency: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          studentId,
          teacherId,
          courseId,
          originalPrice,
          finalPrice,
          paidPrice,
          teacherProfitPercent: new Decimal(teacherProfitPercent),
          teacherProfit,
          status: TransactionStatus.completed,
        },
        include: {
          course: {
            include: {
              teacher: true,
            },
          },
          student: true,
        },
      });

      // Add profit to teacher wallet
      if (teacherProfit.greaterThan(0)) {
        await this.walletService.addToWallet(teacherId, teacherProfit);
      }

      // Grant course ownership
      await tx.ownedList.create({
        data: {
          studentId,
          courseId,
          transactionId: transaction.id,
        },
      });

      return transaction;
    });

    // Send invoice email
    await this.sendPurchaseInvoice(result);

    return {
      transactionId: result.id,
      amount: paidPrice.toNumber(),
      currency,
      walletAmountUsed: walletAmountUsed.toNumber(),
    };
  }

  async completePurchaseFromWebhook(sessionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { stripePaymentId: sessionId },
      include: {
        course: {
          include: {
            teacher: true,
          },
        },
        student: true,
      },
    });

    if (!transaction) {
      console.error(
        `Transaction not found for session ID: ${sessionId}. This might happen if the transaction was created with a different session ID or was deleted.`,
      );
      throw new NotFoundException(
        `Transaction not found for session: ${sessionId}`,
      );
    }

    if (transaction.courseId) {
      const existingOwnership = await this.prisma.ownedList.findUnique({
        where: {
          studentId_courseId: {
            studentId: transaction.studentId,
            courseId: transaction.courseId,
          },
        },
      });

      if (existingOwnership) {
        // Already completed
        return transaction;
      }
    }

    const completedTransaction = await this.prisma.$transaction(async (tx) => {
      // Students don't have wallets - they pay directly via Stripe
      // No wallet deduction needed for students

      // Add profit to teacher wallet (teachers have wallets)
      if (transaction.teacherProfit.greaterThan(0)) {
        await this.walletService.addToWallet(
          transaction.teacherId,
          transaction.teacherProfit,
        );
      }

      // Grant course ownership if course exists
      if (transaction.courseId) {
        await tx.ownedList.create({
          data: {
            studentId: transaction.studentId,
            courseId: transaction.courseId,
            transactionId: transaction.id,
          },
        });
      }

      // Update transaction status to completed
      return tx.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.completed },
        include: {
          course: {
            include: {
              teacher: true,
            },
          },
          student: true,
        },
      });
    });

    // Send invoice email
    await this.sendPurchaseInvoice(completedTransaction);

    return completedTransaction;
  }

  async cancelTransaction(sessionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { stripePaymentId: sessionId, status: TransactionStatus.pending },
    });

    if (!transaction) {
      return null;
    }

    return this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.canceled },
    });
  }

  async rejectTransaction(sessionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { stripePaymentId: sessionId, status: TransactionStatus.pending },
    });

    if (!transaction) {
      return null;
    }

    return this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.rejected },
    });
  }

  private async sendPurchaseInvoice(transaction: {
    id: string;
    createdAt: Date;
    paidPrice: Decimal;
    student: { email: string; name: string | null };
    course: {
      name: string;
      teacher: { name: string | null };
    } | null;
  }) {
    if (!transaction.course) {
      return; // Skip if no course (shouldn't happen for course purchases)
    }

    const currency = await this.settingsService.getCurrency();
    const studentName = transaction.student.name || 'Student';
    const teacherName = transaction.course.teacher.name || 'Instructor';
    const purchaseDate = new Date(transaction.createdAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    try {
      await this.mailService.sendTemplate({
        to: transaction.student.email,
        name: 'invoice-purchase',
        data: {
          studentName,
          transactionId: transaction.id,
          purchaseDate,
          courseName: transaction.course.name,
          teacherName,
          paidPrice: transaction.paidPrice.toFixed(2),
          currency: currency.toUpperCase(),
        },
      });
    } catch (error) {
      // Log error but don't fail the purchase if email fails
      console.error('Failed to send purchase invoice email:', error);
    }
  }
}
