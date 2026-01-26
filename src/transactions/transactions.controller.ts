import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { FindTransactionsQueryDto } from './dto/request/find-transactions-query.dto';
import { TransactionResponseDto } from './dto/response/transaction-response.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Role } from 'src/generated/prisma/client';
import { Router } from 'src/core/router';
import { JwtPayload } from 'src/users/users.types';

@ApiTags('Transactions')
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all transactions (Admin) or my transactions (Client)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  async findAllTransactions(
    @Query() dto: FindTransactionsQueryDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { sub: userId, role } = request.user;

    return this.transactionsService.findAllTransactions(dto, {
      studentId: role === Role.student ? userId : undefined,
      teacherId: role === Role.teacher ? userId : undefined,
    });
  }

  @Get(':transactionId')
  @ApiOperation({
    summary: 'Get a transaction by ID',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
    type: TransactionResponseDto,
  })
  async findTransactionById(@Param('transactionId') transactionId: string) {
    return this.transactionsService.findTransactionById(transactionId);
  }
}
