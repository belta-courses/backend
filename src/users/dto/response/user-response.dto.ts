import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Expose, plainToInstance, Transform } from 'class-transformer';
import { AccessGroupDto } from 'src/auth/dto/response/access-group.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'The id of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'student@beltacourses.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The role of the user',
    example: 'student',
    enum: Role,
  })
  @Expose()
  role: Role;

  @ApiProperty({
    description: 'The cover image of the user',
    example: 'https://example.com/cover.jpg',
  })
  @Expose()
  @Transform(
    ({ value }: { value: { url: string } | null }) => value?.url ?? null,
  )
  cover: string | null;

  // Teacher only
  @ApiProperty({
    description: 'The bio of the teacher, for teacher role only',
    example:
      'Experienced software engineer with 10+ years in web development. Passionate about teaching and helping students achieve their goals.',
  })
  @Expose()
  @Transform(({ obj }: { obj: UserResponseDto }) =>
    obj.role === Role.teacher ? obj.bio : undefined,
  )
  bio?: string | null;

  // Employee only
  @ApiProperty({
    description: 'The gender of the user, for employee role only',
    example: 'male',
    enum: Gender,
  })
  @Expose()
  @Transform(({ obj }: { obj: UserResponseDto }) =>
    obj.role === Role.employee ? obj.gender : undefined,
  )
  gender?: Gender;

  @ApiProperty({
    description: 'The date of birth of the user, for employee role only',
    example: '1990-01-01',
  })
  @Expose()
  @Transform(({ obj }: { obj: UserResponseDto }) =>
    obj.role === Role.employee ? obj.date_of_birth : undefined,
  )
  date_of_birth?: string;

  @ApiProperty({
    description: 'The access group of the user',
  })
  @Expose()
  @Transform(({ obj }: { obj: UserResponseDto }) =>
    obj.role === Role.employee
      ? plainToInstance(AccessGroupDto, obj.accessGroup, {
          excludeExtraneousValues: true,
        })
      : undefined,
  )
  accessGroup?: AccessGroupDto | null;
}
