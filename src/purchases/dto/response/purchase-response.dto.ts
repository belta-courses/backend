import { ApiProperty } from '@nestjs/swagger';

export class PurchaseResponseDto {
  @ApiProperty({
    description: 'Stripe Checkout Session URL - redirect user to this URL',
  })
  checkoutUrl: string;

  @ApiProperty({
    description: 'Checkout Session ID',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Amount to be paid via Stripe (after wallet deduction)',
  })
  amount: number;

  @ApiProperty({
    description: 'Currency',
  })
  currency: string;

  @ApiProperty({
    description: 'Wallet amount used',
  })
  walletAmountUsed: number;
}
