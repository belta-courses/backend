import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateLectureDto {
  @ApiProperty({ example: 'Welcome to the course' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Short introduction to the course and instructor.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '10m',
    description: 'Expected duration to complete this lecture',
  })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiProperty({
    example: 'In this lecture, you will learn the basics of NestJS...',
    description:
      'Lecture content (text/markdown that can include links and image URLs)',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Optional video file id uploaded via storage module',
  })
  @IsUUID()
  @IsOptional()
  videoId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this lecture is available as demo',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  demo?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Order of the lecture inside the module',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;
}
