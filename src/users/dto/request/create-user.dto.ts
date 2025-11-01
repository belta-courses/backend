import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role, Gender } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'student@beltacourses.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "The role of the user, while you can't create admin user",
    example: 'student',
    enum: Role,
  })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    description:
      'The gender of the user, required for employee role, throw error for other roles',
    example: 'male',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description:
      'The date of birth of the user, required for employee role, throw error for other roles',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({
    description:
      'Whether the teacher provides mentorship, required for teacher role, throw error for other roles',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_mentor?: boolean;

  @ApiPropertyOptional({
    description:
      "The session price of teacher's mentorship session (if is_mentor is true), throw error for other roles",
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  session_price?: number | null;

  @ApiPropertyOptional({
    description:
      'Whether the student is new (can take discount), default true, throw error for other roles',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_new?: boolean;
}
