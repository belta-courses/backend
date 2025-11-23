import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { AccessGroupDto } from 'src/auth/dto/response/access-group.dto';

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

  @ApiProperty({
    description: 'The cover image of the user',
    example: 'https://example.com/cover.jpg',
  })
  @Expose()
  cover: string;

  @ApiProperty({
    description: 'The access token of the user',
  })
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

  @ApiProperty({
    description: 'The access group of the user',
  })
  @Expose()
  @Type(() => AccessGroupDto)
  accessGroup: AccessGroupDto;
}

export class TeacherUserResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'The bio of the teacher, for teacher role only',
    example:
      'Experienced software engineer with 10+ years in web development. Passionate about teaching and helping students achieve their goals.',
  })
  @Expose()
  bio: string;
}

export class StudentUserResponseDto extends UserResponseDto {}

export const userResponseDtoMap = {
  [Role.admin]: AdminUserResponseDto,
  [Role.employee]: EmployeeUserResponseDto,
  [Role.teacher]: TeacherUserResponseDto,
  [Role.student]: StudentUserResponseDto,
};
