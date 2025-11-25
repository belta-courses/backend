import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    example: 1,
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    example: 10,
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit: number = 10;
}
