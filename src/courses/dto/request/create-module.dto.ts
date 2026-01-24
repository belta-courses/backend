import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'Introduction' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Overview of the course and what you will learn.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '1h 30m',
    description: 'Expected duration to complete this module',
  })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Order of the module inside the course',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;
}
