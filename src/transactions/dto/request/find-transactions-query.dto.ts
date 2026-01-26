import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/core/dto/pagination.dto';
import { RefundStatus } from 'src/generated/prisma/client';

export class FindTransactionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by refund status',
    enum: RefundStatus,
  })
  @IsEnum(RefundStatus)
  @IsOptional()
  refundStatus?: RefundStatus;

  @ApiPropertyOptional({
    description: 'Filter for transactions without refund request',
  })
  @IsOptional()
  @IsBoolean()
  noRefund?: boolean;
}
