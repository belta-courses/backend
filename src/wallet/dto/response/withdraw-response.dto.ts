import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { WithdrawStatus } from 'src/generated/prisma/client';

export class WithdrawResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Withdrawal amount as a string',
    example: '100.50',
  })
  @Expose()
  amount: string;

  @ApiProperty({
    description: 'PayPal email address',
    example: 'teacher@example.com',
  })
  @Expose()
  paypalEmail: string;

  @ApiProperty({
    description: 'Withdrawal status',
    enum: WithdrawStatus,
    example: WithdrawStatus.pending,
  })
  @Expose()
  status: WithdrawStatus;

  @ApiProperty({
    description: 'PayPal batch payout ID',
    required: false,
  })
  @Expose()
  paypalPayoutId?: string;

  @ApiProperty({
    description: 'PayPal payout item ID',
    required: false,
  })
  @Expose()
  paypalPayoutItemId?: string;

  @ApiProperty({
    description: 'When the withdrawal was created',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the withdrawal was processed',
    required: false,
  })
  @Expose()
  processedAt?: Date;

  @ApiProperty({
    description: 'When the withdrawal failed',
    required: false,
  })
  @Expose()
  failedAt?: Date;

  @ApiProperty({
    description: 'Reason for failure',
    required: false,
  })
  @Expose()
  failureReason?: string;

  @ApiProperty({
    description:
      'User-friendly error message (especially for unclaimed status)',
    required: false,
    example:
      'The PayPal email address does not have a PayPal account. Please create a PayPal account with this email or use a different email address.',
  })
  @Expose()
  errorMessage?: string;
}
