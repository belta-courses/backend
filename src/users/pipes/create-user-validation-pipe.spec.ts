import { Gender, Role } from '@prisma/client';
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
    is_mentor: true,
    session_price: 100,
  };
  const studentFields = {
    is_new: true,
  };

  beforeEach(() => {
    pipe = new CreateUserValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw BadRequestException when [role: admin]', () => {
    const userDto = { ...baseUserDto, role: Role.admin };
    expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
  });

  describe('missing fields', () => {
    it('should throw BadRequestException when [role: employee] and missing gender or date_of_birth', () => {
      const userDto = { ...baseUserDto, role: Role.employee };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when [role: teacher, is_mentor: true] and missing session_price', () => {
      const userDto = { ...baseUserDto, role: Role.teacher, is_mentor: true };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });
  });

  describe('extra fields', () => {
    it('should throw BadRequestException when [role: employee] and is_mentor, session_price or is_new has value', () => {
      const userDto = {
        ...baseUserDto,
        role: Role.employee,
        ...teacherFields,
        ...studentFields,
      };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when [role: teacher] and gender, date_of_birth or is_new has value', () => {
      const userDto = {
        ...baseUserDto,
        role: Role.teacher,
        ...employeeFields,
        ...studentFields,
      };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when [role: student] and gender, date_of_birth or is_mentor has value', () => {
      const userDto = {
        ...baseUserDto,
        role: Role.student,
        ...employeeFields,
        ...teacherFields,
      };
      expect(() => pipe.transform(userDto)).toThrow(BadRequestException);
    });
  });

  describe('data transformation', () => {
    it('should add default [is_new: true] when [role: student]', () => {
      const userDto = { ...baseUserDto, role: Role.student };
      expect(pipe.transform(userDto)).toEqual({ ...userDto, is_new: true });
    });
    it('should accept [is_new: false] when [role: student]', () => {
      const userDto = { ...baseUserDto, role: Role.student, is_new: false };
      expect(pipe.transform(userDto)).toEqual(userDto);
    });

    it('should add default [is_mentor: false] when [role: teacher]', () => {
      const userDto = { ...baseUserDto, role: Role.teacher };
      expect(pipe.transform(userDto)).toEqual({
        ...userDto,
        is_mentor: false,
        session_price: null,
      });
    });
  });
});
