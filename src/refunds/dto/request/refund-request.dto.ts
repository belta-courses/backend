import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefundRequestDto {
  @ApiProperty({
    description: 'Reason for refund request',
    example: 'I am not satisfied with the course content',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  message: string;
}
