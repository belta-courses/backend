import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddBankAccountDto } from './add-bank-account.dto';

export class CreatePayoutDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    example: 100.5,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Bank account details (optional if already saved)',
    type: AddBankAccountDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddBankAccountDto)
  bankAccount?: AddBankAccountDto;
}
