import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { MailService } from 'src/mail/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { JwtPayload } from './users.types';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule],
      controllers: [UsersController],
      providers: [
        { provide: PrismaService, useValue: {} },
        { provide: MailService, useValue: {} },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return transformed response', async () => {
      const createUserDto: CreateUserDto = {
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.student,
      };

      const createdUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.student,
        accessToken: 'mock-token',
        cover: null,
      };

      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBeDefined();
      expect(result.email).toBe(createdUser.email);
    });

    it('should create a teacher user and return transformed response', async () => {
      const createUserDto: CreateUserDto = {
        email: 'teacher@example.com',
        name: 'Test Teacher',
        role: Role.teacher,
        bio: 'Experienced teacher',
      };

      const createdUser = {
        id: '2',
        email: 'teacher@example.com',
        name: 'Test Teacher',
        role: Role.teacher,
        bio: 'Experienced teacher',
        accessToken: 'mock-token',
        cover: null,
      };

      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all users', () => {
      const expectedResult = 'This action returns all users';
      mockUsersService.findAll.mockReturnValue(expectedResult);

      const result = controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });

  describe('getMe', () => {
    it('should return the current user profile', async () => {
      const userPayload: JwtPayload = {
        sub: '1',
        email: 'student@example.com',
        role: Role.student,
        purpose: null,
      };

      const mockUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.student,
        cover: null,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const request = { user: userPayload };
      const result = await controller.getMe(request);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('updateMe', () => {
    it('should update the current user profile', async () => {
      const userPayload: JwtPayload = {
        sub: '1',
        email: 'student@example.com',
        role: Role.student,
        purpose: null,
      };

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const mockOldUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.student,
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Updated Name',
        role: Role.student,
      };

      mockUsersService.findOne.mockResolvedValue(mockOldUser);
      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const request = { user: userPayload };
      const result = await controller.updateMe(updateUserDto, request);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe(mockUpdatedUser.name);
    });
  });

  describe('findOne', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.student,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('student@example.com');

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        'student@example.com',
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user by email (admin updating student)', async () => {
      const adminPayload: JwtPayload = {
        sub: '1',
        email: 'admin@example.com',
        role: Role.admin,
        purpose: null,
      };

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Student Name',
      };

      const mockOldUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.student,
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Updated Student Name',
        role: Role.student,
      };

      mockUsersService.findOne.mockResolvedValue(mockOldUser);
      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const request = { user: adminPayload };
      const result = await controller.update(
        'student@example.com',
        updateUserDto,
        request,
      );

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        'student@example.com',
      );
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.name).toBe(mockUpdatedUser.name);
    });

    it('should throw ForbiddenException when non-admin tries to update admin', async () => {
      const employeePayload: JwtPayload = {
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
      };

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Admin Name',
      };

      const mockAdminUser = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: Role.admin,
      };

      mockUsersService.findOne.mockResolvedValue(mockAdminUser);

      const request = { user: employeePayload };

      await expect(
        controller.update('admin@example.com', updateUserDto, request),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        'admin@example.com',
      );
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should allow employee to update student', async () => {
      const employeePayload: JwtPayload = {
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
      };

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Student Name',
      };

      const mockOldUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Test Student',
        role: Role.student,
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'student@example.com',
        name: 'Updated Student Name',
        role: Role.student,
      };

      mockUsersService.findOne.mockResolvedValue(mockOldUser);
      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const request = { user: employeePayload };
      const result = await controller.update(
        'student@example.com',
        updateUserDto,
        request,
      );

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        'student@example.com',
      );
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow admin to update another admin', async () => {
      const adminPayload: JwtPayload = {
        sub: '1',
        email: 'admin1@example.com',
        role: Role.admin,
        purpose: null,
      };

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Admin Name',
      };

      const mockOldUser = {
        id: '2',
        email: 'admin2@example.com',
        name: 'Admin Two',
        role: Role.admin,
      };

      const mockUpdatedUser = {
        id: '2',
        email: 'admin2@example.com',
        name: 'Updated Admin Name',
        role: Role.admin,
      };

      mockUsersService.findOne.mockResolvedValue(mockOldUser);
      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const request = { user: adminPayload };
      const result = await controller.update(
        'admin2@example.com',
        updateUserDto,
        request,
      );

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        'admin2@example.com',
      );
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
