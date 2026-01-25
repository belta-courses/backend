import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WalletResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Wallet amount as a string',
    example: '0.00',
  })
  @Expose()
  amount: string;
}
