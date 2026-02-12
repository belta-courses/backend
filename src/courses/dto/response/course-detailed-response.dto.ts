import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, Prisma } from 'src/generated/prisma/client';
import { Expose, Transform } from 'class-transformer';

type DetailedCourse = Prisma.CourseGetPayload<{
  include: {
    teacher: {
      include: { cover: true };
    };
    modules: {
      include: {
        lectures: true;
      };
    };
    cover: true;
    introVideo: true;
  };
}>;

class LectureSummaryDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  duration: string | null;
}

class ModuleSummaryDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  duration: string | null;

  @ApiProperty({ type: () => [LectureSummaryDto] })
  @Expose()
  lectures: LectureSummaryDto[];
}

export class CourseDetailedResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({
    description: 'Course price as decimal string',
    example: '99.99',
  })
  @Expose()
  @Transform(({ value }: { value: Prisma.Decimal }) => value.toString())
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
  @Transform(({ obj }: { obj: DetailedCourse }) => {
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

  @ApiProperty({ type: () => [ModuleSummaryDto] })
  @Expose()
  @Transform(({ obj }: { obj: DetailedCourse }) =>
    obj.modules?.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      duration: m.duration,
      order: m.order,
      lectures: m.lectures.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        duration: l.duration,
        demo: l.demo,
        order: l.order,
      })),
    })),
  )
  modules: ModuleSummaryDto[];
}
