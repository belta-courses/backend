import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { RefundRequestDto } from './dto/request/refund-request.dto';
import { ReviewRefundDto } from './dto/request/review-refund.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/generated/prisma/client';
import { Router } from 'src/core/router';
import { JwtPayload } from 'src/users/users.types';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { AccessedBy } from 'src/auth/permissions.decorator';
import { Permission } from 'src/core/config/permissions.config';
import { PaginationDto } from 'src/core/dto/pagination.dto';

@ApiTags(Router.Refunds.ApiTag)
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@Controller(Router.Refunds.Base)
@UseGuards(AuthGuard)
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post(Router.Refunds.ByTransactionId)
  @ApiOperation({
    summary: 'Request a refund for a transaction (Student only)',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction ID to request refund for',
  })
  @ApiResponse({
    status: 201,
    description: 'Refund request created successfully',
  })
  @UseGuards(RolesGuard)
  @Roles(Role.student)
  async requestRefund(
    @Param('transactionId') transactionId: string,
    @Body() dto: RefundRequestDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { sub: studentId } = request.user;
    return this.refundsService.requestRefund(transactionId, studentId, dto);
  }

  @Patch(Router.Refunds.Review)
  @ApiOperation({ summary: 'Review a refund request (Admin only)' })
  @ApiParam({
    name: 'refundId',
    description: 'Refund ID to review',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund request reviewed successfully',
  })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_FULL_ACCESS)
  async reviewRefund(
    @Param('refundId') refundId: string,
    @Body() dto: ReviewRefundDto,
  ) {
    return this.refundsService.reviewRefund(refundId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all refund requests (Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Refund requests retrieved successfully',
  })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_FULL_ACCESS)
  async findAllRefunds(@Query() dto: PaginationDto) {
    return this.refundsService.findAllRefunds(dto);
  }

  @Get(Router.Refunds.ById)
  @ApiOperation({ summary: 'Get a refund request by ID (Admin only)' })
  @ApiParam({
    name: 'refundId',
    description: 'Refund ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund request retrieved successfully',
  })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_FULL_ACCESS)
  async findRefundById(@Param('refundId') refundId: string) {
    return this.refundsService.findRefundById(refundId);
  }
}
