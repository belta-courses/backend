import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindWalletsQueryDto } from './dto/request/find-wallets-query.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/generated/prisma/client';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
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
}
