import { ApiProperty } from '@nestjs/swagger';
import { Prisma, Role } from 'src/generated/prisma/client';
import { Expose, Transform } from 'class-transformer';

type DetailedCourse = Prisma.CourseGetPayload<{
  include: {
    teacher: true;
    modules: {
      include: {
        lectures: true;
      };
    };
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

  @ApiProperty({
    description: 'Basic teacher info (id, name, role, bio)',
  })
  @Expose()
  @Transform(({ obj }: { obj: DetailedCourse }) => {
    if (!obj.teacher) return null;
    return {
      id: obj.teacher.id,
      name: obj.teacher.name,
      role: obj.teacher.role,
      bio: obj.teacher.bio,
    };
  })
  teacher: {
    id: string;
    name: string;
    role: Role;
    bio?: string | null;
  } | null;

  @ApiProperty({ type: () => [ModuleSummaryDto] })
  @Expose()
  @Transform(({ obj }: { obj: DetailedCourse }) =>
    obj.modules?.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      duration: m.duration,
      lectures: m.lectures.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        duration: l.duration,
      })),
    })),
  )
  modules: ModuleSummaryDto[];
}
