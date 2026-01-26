import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindWalletsQueryDto } from './dto/request/find-wallets-query.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!wallet) {
      await this.usersService.findOne(userId); // will throw error if user not found

      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          amount: new Decimal(0),
        },
      });
    }

    return wallet;
  }

  async findWalletByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!wallet) {
      await this.usersService.findOne(userId); // will throw error if user not found

      return {
        id: 'not-exists',
        userId: userId,
        amount: new Decimal(0),
        createdAt: new Date(),
      };
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
