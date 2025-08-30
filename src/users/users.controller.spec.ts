import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Gender, Role } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        PrismaService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn((user: CreateUserDto): CreateUserDto => user),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('return only fields that related to the role', () => {
    const baseUserDto = {
      email: 'user4@gmail.com',
      name: 'Fourth Employee',
    };
    it('should not return is_mentor, session_price or is_new', async () => {
      const employeeDto = {
        ...baseUserDto,
        role: Role.employee,
        gender: Gender.male,
        date_of_birth: '1990-01-01',
      };

      const user = await controller.create({
        ...employeeDto,
        is_mentor: true,
        session_price: 100,
        is_new: false,
      });
      expect(user).not.toHaveProperty('is_mentor');
      expect(user).not.toHaveProperty('session_price');
      expect(user).not.toHaveProperty('is_new');
      expect(user).toEqual(employeeDto);
    });

    it('should not return gender, date_of_birth or is_new', async () => {
      const teacherDto = {
        ...baseUserDto,
        role: Role.teacher,
        is_mentor: true,
        session_price: 100,
      };

      const user = await controller.create({
        ...teacherDto,
        gender: Gender.male,
        date_of_birth: '1990-01-01',
        is_new: false,
      });
      expect(user).not.toHaveProperty('gender');
      expect(user).not.toHaveProperty('date_of_birth');
      expect(user).not.toHaveProperty('is_new');
      expect(user).toEqual(teacherDto);
    });

    it('should not return is_mentor, session_price, gender, date_of_birth', async () => {
      const studentDto = {
        ...baseUserDto,
        role: Role.student,
        is_new: true,
      };

      const user = await controller.create({
        ...studentDto,
        is_mentor: true,
        session_price: 100,
        gender: Gender.male,
        date_of_birth: '1990-01-01',
      });
      expect(user).not.toHaveProperty('is_mentor');
      expect(user).not.toHaveProperty('session_price');
      expect(user).not.toHaveProperty('gender');
      expect(user).not.toHaveProperty('date_of_birth');
      expect(user).toEqual(studentDto);
    });
  });
});
