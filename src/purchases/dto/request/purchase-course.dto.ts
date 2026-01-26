import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class PurchaseCourseDto {
  @ApiProperty({
    description: 'Whether to use wallet balance for payment',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  useWallet?: boolean = true;

  @ApiPropertyOptional({
    description: 'URL to redirect to after successful payment',
    example: 'https://your-frontend.com/purchase/success',
  })
  @IsUrl({ require_tld: false })
  @IsOptional()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to redirect to if payment is cancelled',
    example: 'https://your-frontend.com/purchase/cancel',
  })
  @IsUrl({ require_tld: false })
  @IsOptional()
  cancelUrl?: string;
}
