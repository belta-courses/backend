import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { WithdrawStatus } from 'src/generated/prisma/client';
import { WithdrawHistoryResponseDto } from './withdraw-history-response.dto';

export class WithdrawResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Public payout ID' })
  @Expose()
  payoutId: string;

  @ApiProperty({ description: 'Paypal batch ID' })
  @Expose()
  paypalBatchId: string;

  @ApiProperty({ description: 'Paypal item ID' })
  @Expose()
  paypalItemId: string;

  @ApiProperty()
  @Expose()
  amount: string;

  @ApiProperty({ description: 'Paypal email provided to claim the payout' })
  @Expose()
  paypalEmail: string;

  @ApiProperty()
  @Expose()
  status: WithdrawStatus;

  @ApiProperty()
  @Expose()
  histories: WithdrawHistoryResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
