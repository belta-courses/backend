import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateWithdrawDto {
  @ApiProperty({
    description: 'PayPal email address to receive the payout',
    example: 'teacher@example.com',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  paypalEmail: string;
}
