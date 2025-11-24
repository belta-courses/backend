import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class FindUsersQueryDto {
  @ApiProperty({
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page: number;

  @ApiProperty({
    example: 10,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit: number;

  @ApiProperty({
    description: 'Search by email or name',
    required: false,
  })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
    example: Role.student,
    enum: Role,
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role: Role;
}
