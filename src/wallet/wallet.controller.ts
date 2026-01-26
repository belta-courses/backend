import {
  Controller,
  Get,
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
}
