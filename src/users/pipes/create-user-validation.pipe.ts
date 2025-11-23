import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CreateUserValidationPipe implements PipeTransform {
  constructor() {}

  transform(value: CreateUserDto) {
    const { email, name, role, coverId, date_of_birth, gender, bio } = value;
    const base = { email, name, role, coverId };
    switch (role) {
      case Role.admin:
        return base;

      case Role.employee:
        if (!date_of_birth || !gender) {
          throw new BadRequestException(
            'Date of birth and gender are required for employee',
          );
        }
        if (bio) {
          throw new BadRequestException('Employee cannot have bio');
        }

        return { ...base, gender, date_of_birth };

      case Role.teacher:
        if (date_of_birth || gender) {
          throw new BadRequestException(
            'Teacher cannot have date_of_birth, gender, or is_new',
          );
        }
        return {
          ...base,
          bio,
        };

      case Role.student:
        if (date_of_birth || gender || bio) {
          throw new BadRequestException(
            'Student cannot have date_of_birth, gender, or bio',
          );
        }
        return { ...base };
    }
  }
}
