import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsEmail,
  IsUUID,
} from 'class-validator';
import { Role, Gender } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'student@beltacourses.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'The cover image of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  coverId?: string;

  @ApiProperty({
    description: "The role of the user, while you can't create admin user",
    example: 'student',
    enum: [Role.employee, Role.teacher, Role.student],
  })
  @IsEnum([Role.employee, Role.teacher, Role.student], {
    message: 'Invalid role, must be employee, teacher, or student',
  })
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
      'The bio of the teacher, required for teacher role, throw error for other roles',
    example:
      'Experienced software engineer with 10+ years in web development. Passionate about teaching and helping students achieve their goals.',
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
