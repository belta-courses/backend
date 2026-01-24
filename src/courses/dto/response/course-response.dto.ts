import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, Prisma, Role } from 'src/generated/prisma/client';
import { Expose, Transform } from 'class-transformer';

type CourseWithTeacher = Prisma.CourseGetPayload<{
  include: { teacher: true };
}>;

export class CourseResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  description: string | null;

  @Expose()
  @ApiProperty({
    description: 'Course price as a number',
    example: '99.99',
  })
  @Expose()
  price: string;

  @ApiProperty({ enum: CourseStatus })
  @Expose()
  status: CourseStatus;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  publishedAt: Date | null;

  @ApiProperty({
    description: 'Basic teacher info (id, name, role)',
  })
  @Expose()
  @Transform(({ obj }: { obj: CourseWithTeacher }) => {
    if (!obj.teacher) return null;
    return {
      id: obj.teacher.id,
      name: obj.teacher.name,
      role: obj.teacher.role,
    };
  })
  teacher: {
    id: string;
    name: string;
    role: Role;
  } | null;
}
