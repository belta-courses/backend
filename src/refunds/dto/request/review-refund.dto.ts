import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { RefundStatus } from 'src/generated/prisma/client';

export class ReviewRefundDto {
  @ApiProperty({
    description: 'Refund status',
    enum: RefundStatus,
    example: RefundStatus.approved,
  })
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @ApiProperty({
    description: 'Admin response (required if status is rejected)',
    example: 'Refund request does not meet our policy requirements',
    required: false,
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o: ReviewRefundDto) => o.status === RefundStatus.rejected)
  response?: string;
}
