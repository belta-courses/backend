import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/request/create-payout.dto';
import { AddBankAccountDto } from './dto/request/add-bank-account.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/generated/prisma/client';
import { Router } from 'src/core/router';
import { JwtPayload } from 'src/users/users.types';
import { GetPayoutHistoryQueryDto } from './dto/request/get-payout-hestory-query.dto';

@ApiTags('Payouts')
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@Controller('payouts')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.student, Role.teacher)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payout request' })
  @ApiResponse({
    status: 201,
    description: 'Payout created successfully',
  })
  async createPayout(
    @Body() dto: CreatePayoutDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { sub: userId } = request.user;
    return this.payoutsService.createPayout(userId, dto);
  }

  @Post('bank-account')
  @ApiOperation({ summary: 'Add or update bank account for payouts' })
  @ApiResponse({
    status: 201,
    description: 'Bank account added successfully',
  })
  async addBankAccount(
    @Body() dto: AddBankAccountDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { sub: userId } = request.user;
    return this.payoutsService.addBankAccount(userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payout history' })
  @ApiResponse({
    status: 200,
    description: 'Payout history retrieved successfully',
  })
  async getPayoutHistory(
    @Query() dto: GetPayoutHistoryQueryDto,
    @Request() request?: { user: JwtPayload },
  ) {
    const userId = request?.user?.sub;
    if (!userId) {
      throw new Error('User not found');
    }
    return this.payoutsService.getPayoutHistory(dto);
  }
}
