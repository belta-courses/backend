import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCourseBaseDto {
  @ApiProperty({ example: 'Complete NestJS Course' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Learn NestJS by building a real-world REST API.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '99.99' })
  @IsDecimal()
  price: string;

  @ApiPropertyOptional({ example: '' })
  @IsUUID()
  @IsOptional()
  coverId?: string;
}

export class TeacherCreateCourseDto extends CreateCourseBaseDto {}

export class CreateCourseDto extends CreateCourseBaseDto {
  @ApiProperty({
    description: 'Teacher id to assign the course to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  teacherId: string;
}
