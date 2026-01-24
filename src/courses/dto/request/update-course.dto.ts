import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseBaseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseBaseDto) {}
