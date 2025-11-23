import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { StorageService } from 'src/storage/storage.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockStorageService = {
    getFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: {} },
        { provide: JwtService, useValue: mockJwtService },
        { provide: StorageService, useValue: mockStorageService },
        UsersService,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      role: Role.student,
    };

    it('should throw BadRequestException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });

    it('should throw NotFoundException if coverId is provided but cover does not exist', async () => {
      const createUserDtoWithCover: CreateUserDto = {
        ...createUserDto,
        coverId: 'cover-123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockStorageService.getFile.mockResolvedValue(null);

      await expect(service.create(createUserDtoWithCover)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockStorageService.getFile).toHaveBeenCalledWith('cover-123');
    });

    it('should successfully create a user without cover', async () => {
      const newUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
        coverId: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(newUser);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.create(createUserDto);

      expect(result).toEqual({
        ...newUser,
        accessToken: 'mock-jwt-token',
        coverId: undefined,
        cover: undefined,
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });

    it('should successfully create a user with cover', async () => {
      const createUserDtoWithCover: CreateUserDto = {
        ...createUserDto,
        coverId: 'cover-123',
      };

      const mockCover = {
        id: 'cover-123',
        url: 'https://example.com/cover.jpg',
      };

      const newUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
        coverId: 'cover-123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockStorageService.getFile.mockResolvedValue(mockCover);
      mockPrismaService.user.create.mockResolvedValue(newUser);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.create(createUserDtoWithCover);

      expect(result).toEqual({
        ...newUser,
        accessToken: 'mock-jwt-token',
        coverId: undefined,
        cover: 'https://example.com/cover.jpg',
      });
      expect(mockStorageService.getFile).toHaveBeenCalledWith('cover-123');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent@example.com')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent@example.com')).rejects.toThrow(
        'User not found',
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should return user if user exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should throw error if user does not exist', async () => {
      const prismaError = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });
      mockPrismaService.user.update.mockRejectedValue(prismaError);

      await expect(
        service.update('nonexistent@example.com', updateUserDto),
      ).rejects.toThrow('Record not found');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        data: updateUserDto,
      });
    });

    it('should successfully update user if user exists', async () => {
      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        role: Role.student,
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('test@example.com', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: updateUserDto,
      });
    });
  });
});
