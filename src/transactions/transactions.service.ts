import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindTransactionsQueryDto } from './dto/request/find-transactions-query.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTransactions(
    { page, limit, refundStatus, noRefund }: FindTransactionsQueryDto,
    { studentId, teacherId }: { studentId?: string; teacherId?: string },
  ) {
    const where: Prisma.TransactionWhereInput = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (refundStatus) {
      where.refund = {
        status: refundStatus,
      };
    }

    if (noRefund) {
      where.refund = null;
    }

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          refund: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        limit,
        count: transactions.length,
        total,
      },
    };
  }

  async findTransactionById(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        refund: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
