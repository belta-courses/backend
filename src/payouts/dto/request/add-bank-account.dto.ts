import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class AddBankAccountDto {
  @ApiProperty({
    description: 'Bank account number',
    example: '000123456789',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    description: 'Bank routing number (or SWIFT/BIC for international)',
    example: '110000000',
  })
  @IsString()
  @IsNotEmpty()
  routingNumber: string;

  @ApiProperty({
    description: 'Account holder name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty({
    description: 'Account holder type',
    enum: ['individual', 'company'],
    example: 'individual',
  })
  @IsIn(['individual', 'company'])
  accountHolderType: 'individual' | 'company';

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty()
  country: string;
}
