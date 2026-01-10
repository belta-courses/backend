import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/core/dto/pagination.dto';

export class FindUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by email or name',
  })
  @IsString()
  @IsOptional()
  search: string;

  @ApiPropertyOptional({
    example: Role.student,
    enum: Role,
  })
  @IsEnum(Role)
  @IsOptional()
  role: Role;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    value === 'null' ? null : value,
  )
  accessGroupId: string | null;
}
