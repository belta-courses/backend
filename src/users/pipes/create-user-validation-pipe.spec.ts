import { Gender, Role } from 'src/generated/prisma/client';
import { CreateUserValidationPipe } from './create-user-validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('CreateUserValidationPipe', () => {
  let pipe: CreateUserValidationPipe;

  const baseUserDto = {
    email: 'test@test.com',
    name: 'Test User',
  };
  const employeeFields = {
    gender: Gender.male,
    date_of_birth: '1990-01-01',
  };
  const teacherFields = {
    bio: 'Experienced software engineer with 10+ years in web development',
  };

  beforeEach(() => {
    pipe = new CreateUserValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('missing fields', () => {
    it('should throw BadRequestException when [role: employee] and missing gender or date_of_birth', () => {
      const userDto = { ...baseUserDto, role: Role.employee };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });
  });

  describe('extra fields', () => {
    it('should throw BadRequestException when [role: employee] and bio has value', () => {
      const userDto = {
        ...baseUserDto,
        role: Role.employee,
        ...teacherFields,
      };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when [role: teacher] and gender, date_of_birth has value', () => {
      const userDto = {
        ...baseUserDto,
        role: Role.teacher,
        ...employeeFields,
      };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when [role: student] and gender, date_of_birth or bio has value', () => {
      const userDto = {
        ...baseUserDto,
        role: Role.student,
        ...employeeFields,
        ...teacherFields,
      };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });
  });
});
