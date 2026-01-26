import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class PurchaseCourseDto {
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
