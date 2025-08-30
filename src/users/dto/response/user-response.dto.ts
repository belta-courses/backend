import { Gender, Role } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  role: Role;
}

export class AdminUserResponseDto extends UserResponseDto {}

export class EmployeeUserResponseDto extends UserResponseDto {
  @Expose()
  gender: Gender;

  @Expose()
  date_of_birth: string;
}

export class TeacherUserResponseDto extends UserResponseDto {
  @Expose()
  is_mentor: boolean;

  @Expose()
  session_price: number | null;
}

export class StudentUserResponseDto extends UserResponseDto {
  @Expose()
  is_new: boolean;
}

export const userResponseDtoMap = {
  [Role.admin]: AdminUserResponseDto,
  [Role.employee]: EmployeeUserResponseDto,
  [Role.teacher]: TeacherUserResponseDto,
  [Role.student]: StudentUserResponseDto,
};
