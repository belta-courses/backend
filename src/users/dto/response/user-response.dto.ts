import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserResponseDto {
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

  @Expose()
  accessToken: string;
}

export class AdminUserResponseDto extends UserResponseDto {}

export class EmployeeUserResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'The gender of the user, for employee role only',
    example: 'male',
    enum: Gender,
  })
  @Expose()
  gender: Gender;

  @ApiProperty({
    description: 'The date of birth of the user, for employee role only',
    example: '1990-01-01',
  })
  @Expose()
  date_of_birth: string;
}

export class TeacherUserResponseDto extends UserResponseDto {
  @ApiProperty({
    description:
      'Whether the teacher provides mentorship, for teacher role only',
    example: true,
  })
  @Expose()
  is_mentor: boolean;

  @ApiProperty({
    description:
      "The session price of teacher's mentorship session (if is_mentor is true), for teacher role only",
    example: 100,
  })
  @Expose()
  session_price: number | null;
}

export class StudentUserResponseDto extends UserResponseDto {
  @ApiProperty({
    description:
      'Whether the student is new (can take discount), for student role only',
    example: true,
  })
  @Expose()
  is_new: boolean;
}

export const userResponseDtoMap = {
  [Role.admin]: AdminUserResponseDto,
  [Role.employee]: EmployeeUserResponseDto,
  [Role.teacher]: TeacherUserResponseDto,
  [Role.student]: StudentUserResponseDto,
};
