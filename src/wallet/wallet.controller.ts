import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletResponseDto } from './dto/response/wallet-response.dto';
import { plainToInstance } from 'class-transformer';
import { Role } from 'src/generated/prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayload } from 'src/users/users.types';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { Permission } from 'src/core/config/permissions.config';
import { AccessedBy } from 'src/auth/permissions.decorator';
import { Router } from 'src/core/router';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { FindWalletsQueryDto } from './dto/request/find-wallets-query.dto';
import { getNoDecimalWallet } from './utils/convert-wallet';
import { getNoDecimalWithdraw } from './utils/convert-withdraw';
import { CreateWithdrawDto } from './dto/request/create-withdraw.dto';
import { WithdrawResponseDto } from './dto/response/withdraw-response.dto';
import { FindWithdrawsQueryDto } from './dto/request/find-withdraws-query.dto';

@ApiTags(Router.Wallet.ApiTag)
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@Controller(Router.Wallet.Base)
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(Router.Wallet.Me)
  @ApiOperation({ summary: 'Get my wallet (Teacher only)' })
  @ApiResponse({
    status: 200,
    description: 'The wallet has been successfully retrieved',
    type: WalletResponseDto,
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.teacher)
  async getMyWallet(@Request() request: { user: JwtPayload }) {
    const { sub: userId } = request['user'];

    const wallet = await this.walletService.getOrCreateWallet(userId);

    return plainToInstance(WalletResponseDto, getNoDecimalWallet(wallet), {
      excludeExtraneousValues: true,
    });
  }

  @Get(Router.Wallet.ByUserId)
  @ApiOperation({ summary: 'Get a user wallet by userId (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The wallet has been successfully retrieved',
    type: WalletResponseDto,
  })
  @ApiParam({
    name: 'userId',
    example: '',
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_WALLET, Permission.USERS_FULL_ACCESS)
  async getUserWallet(@Param('userId') userId: string) {
    const wallet = await this.walletService.getOrCreateWallet(userId);

    return plainToInstance(WalletResponseDto, getNoDecimalWallet(wallet), {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The wallets have been successfully retrieved',
    type: [WalletResponseDto],
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_WALLET, Permission.USERS_FULL_ACCESS)
  async getAllWallets(@Query() dto: FindWalletsQueryDto) {
    const wallets = await this.walletService.findAllWallets(dto);

    return {
      data: plainToInstance(
        WalletResponseDto,
        wallets.data.map((item) => getNoDecimalWallet(item)),
        {
          excludeExtraneousValues: true,
        },
      ),
      meta: wallets.meta,
    };
  }

  @Post(Router.Wallet.Withdraw)
  @ApiOperation({
    summary: 'Request a withdrawal of full wallet balance (Teacher only)',
    description:
      'Withdraws the entire wallet balance. Minimum withdrawal amount is $10 USD.',
  })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request has been successfully created',
    type: WithdrawResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Wallet balance is less than $10 USD minimum withdrawal amount',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.teacher)
  async requestWithdrawal(
    @Request() request: { user: JwtPayload },
    @Body() dto: CreateWithdrawDto,
  ) {
    const { sub: userId } = request['user'];

    const withdrawal = await this.walletService.requestWithdrawal(userId, dto);

    return withdrawal
      ? plainToInstance(WithdrawResponseDto, getNoDecimalWithdraw(withdrawal), {
          excludeExtraneousValues: true,
        })
      : null;
  }

  @Get(Router.Wallet.MyWithdraws)
  @ApiOperation({ summary: 'Get my withdrawals (Teacher only)' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawals have been successfully retrieved',
    type: [WithdrawResponseDto],
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.teacher)
  async getMyWithdrawals(
    @Request() request: { user: JwtPayload },
    @Query() dto: FindWithdrawsQueryDto,
  ) {
    const { sub: userId } = request['user'];

    const withdrawals = await this.walletService.getWithdrawals(dto, userId);

    return {
      data: plainToInstance(
        WithdrawResponseDto,
        withdrawals.data.map((item) => getNoDecimalWithdraw(item)),
        {
          excludeExtraneousValues: true,
        },
      ),
      meta: withdrawals.meta,
    };
  }

  @Get(Router.Wallet.UserWithdraws)
  @ApiOperation({ summary: 'Get user withdrawals by userId (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawals have been successfully retrieved',
    type: [WithdrawResponseDto],
  })
  @ApiParam({
    name: 'userId',
    example: '',
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_WALLET, Permission.USERS_FULL_ACCESS)
  async getUserWithdrawals(
    @Param('userId') userId: string,
    @Query() dto: FindWithdrawsQueryDto,
  ) {
    const withdrawals = await this.walletService.getWithdrawals(dto, userId);

    return {
      data: plainToInstance(
        WithdrawResponseDto,
        withdrawals.data.map((item) => getNoDecimalWithdraw(item)),
        {
          excludeExtraneousValues: true,
        },
      ),
      meta: withdrawals.meta,
    };
  }

  @Get(Router.Wallet.AllWithdraws)
  @ApiOperation({ summary: 'Get all withdrawals (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawals have been successfully retrieved',
    type: [WithdrawResponseDto],
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_WALLET, Permission.USERS_FULL_ACCESS)
  async getAllWithdrawals(@Query() dto: FindWithdrawsQueryDto) {
    const withdrawals = await this.walletService.getWithdrawals(dto);

    return {
      data: plainToInstance(
        WithdrawResponseDto,
        withdrawals.data.map((item) => getNoDecimalWithdraw(item)),
        {
          excludeExtraneousValues: true,
        },
      ),
      meta: withdrawals.meta,
    };
  }
}
