import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, Max, Min } from 'class-validator';

export class CreateWithdrawDto {
  @ApiProperty({
    description: 'PayPal email address to receive the payout',
    example: 'teacher@example.com',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  paypalEmail: string;

  @ApiProperty({
    description: 'Amount to withdraw',
    example: 100.5,
  })
  @IsNumber({}, { message: 'Must be a number' })
  @Min(10, { message: 'Minimum withdrawal amount is $10 USD' })
  @Max(10000, { message: 'Maximum withdrawal amount is $10000 USD' })
  amount: number;
}
