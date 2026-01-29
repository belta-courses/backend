import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CourseResponseDto } from './course-response.dto';

export class CourseStudentResponseDto extends CourseResponseDto {
  @ApiProperty({
    description: 'Whether the course is saved by the student',
    example: true,
  })
  @Expose()
  isSaved: boolean;

  @ApiProperty({
    description: 'Whether the course is owned by the student',
    example: false,
  })
  @Expose()
  isOwned: boolean;
}
