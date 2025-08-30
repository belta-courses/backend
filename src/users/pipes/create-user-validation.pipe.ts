import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CreateUserValidationPipe implements PipeTransform {
  constructor() {}

  transform(value: CreateUserDto) {
    const {
      email,
      name,
      role,
      date_of_birth,
      gender,
      is_mentor,
      session_price,
      is_new,
    } = value;
    const base = { email, name, role };
    switch (role) {
      case Role.admin:
        throw new BadRequestException("Can't create admin user");

      case Role.employee:
        if (!date_of_birth || !gender) {
          throw new BadRequestException(
            'Date of birth and gender are required for employee',
          );
        }
        if (is_mentor || session_price || is_new) {
          throw new BadRequestException(
            'Employee cannot have mentor, session price, or is_new',
          );
        }

        return { ...base, gender, date_of_birth };

      case Role.teacher:
        if (date_of_birth || gender || is_new) {
          throw new BadRequestException(
            'Teacher cannot have date_of_birth, gender, or is_new',
          );
        }
        if (is_mentor && !session_price) {
          throw new BadRequestException(
            'Teacher must have session price if is_mentor is true',
          );
        }
        return {
          ...base,
          is_mentor: is_mentor ?? false,
          session_price: session_price ?? null,
        };

      case Role.student:
        if (date_of_birth || gender || is_mentor || session_price) {
          throw new BadRequestException(
            'Student cannot have date_of_birth, gender, mentor, or session price',
          );
        }
        return { ...base, is_new: is_new ?? true };
    }
  }
}
