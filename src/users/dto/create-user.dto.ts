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

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsBoolean()
  is_mentor?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  session_price?: number | null;

  @IsOptional()
  @IsBoolean()
  is_new?: boolean;
}
