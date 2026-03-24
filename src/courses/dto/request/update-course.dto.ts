import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseBaseDto } from './create-course.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourseDto extends PartialType(CreateCourseBaseDto) {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  introVideoId?: string | null;
}
