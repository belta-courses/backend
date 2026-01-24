import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from 'src/generated/prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/core/dto/pagination.dto';

export class FindCoursesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search term for course name or teacher name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by teacher id',
  })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: CourseStatus,
  })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}
