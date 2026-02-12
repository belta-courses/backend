import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, Prisma } from 'src/generated/prisma/client';
import { Expose, Transform } from 'class-transformer';

type CourseWithTeacher = Prisma.CourseGetPayload<{
  include: {
    teacher: { include: { cover: true } };
    cover: true;
    introVideo: true;
  };
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
    description: 'Basic teacher info (id, name, email, cover)',
  })
  @Expose()
  @Transform(({ obj }: { obj: CourseWithTeacher }) => {
    if (!obj.teacher) return null;
    return {
      id: obj.teacher.id,
      name: obj.teacher.name,
      email: obj.teacher.email,
      cover: obj.teacher.cover?.url ?? null,
    };
  })
  teacher: {
    id: string;
    name: string;
    email: string;
    cover: string | null;
  } | null;

  @ApiProperty({
    description: 'Thumbnail of the course',
    example: 'https://example.com/cover.jpg',
  })
  @Expose()
  @Transform(
    ({ value }: { value: { url: string } | null }) => value?.url ?? null,
  )
  cover: string | null;

  @ApiProperty({
    description: 'Intro video of the course',
    example: 'https://example.com/intro.jpg',
  })
  @Expose()
  @Transform(
    ({ value }: { value: { url: string } | null }) => value?.url ?? null,
  )
  introVideo: string | null;
}
