import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/core/dto/pagination.dto';

export class FindUsersQueryDto extends PaginationDto {
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
