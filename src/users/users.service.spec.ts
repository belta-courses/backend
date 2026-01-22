import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { StorageService } from 'src/storage/storage.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { Role } from 'src/generated/prisma/client';

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
    deleteFile: jest.fn(),
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
        cover: null,
        accessGroup: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(newUser);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.create(createUserDto);

      expect(result).toEqual(newUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
        include: { cover: true, accessGroup: true },
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
        cover: mockCover,
        accessGroup: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockStorageService.getFile.mockResolvedValue(mockCover);
      mockPrismaService.user.create.mockResolvedValue(newUser);
      mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.create(createUserDtoWithCover);

      expect(result).toEqual(newUser);
      expect(mockStorageService.getFile).toHaveBeenCalledWith('cover-123');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        'User not found',
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        include: {
          cover: true,
          accessGroup: {
            include: { permissions: true },
          },
        },
      });
    });

    it('should return user if user exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
        cover: null,
        accessGroup: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: {
          cover: true,
          accessGroup: { include: { permissions: true } },
        },
      });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should throw error if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
    });

    it('should successfully update user if user exists', async () => {
      const oldUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
        coverId: null,
      };

      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        role: Role.student,
        coverId: null,
        cover: null,
        accessGroup: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(oldUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(updatedUser.id, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: updatedUser.id },
        data: updateUserDto,
        include: { cover: true, accessGroup: true },
      });
    });

    it('should delete old cover file when updating with new cover', async () => {
      const oldUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
        coverId: 'old-cover-id',
      };

      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.student,
        coverId: 'new-cover-id',
        cover: { id: 'new-cover-id', url: 'https://example.com/new.jpg' },
        accessGroup: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(oldUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      await service.update(oldUser.id, {
        name: 'Test User',
        coverId: 'new-cover-id',
      });

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        'old-cover-id',
      );
    });
  });
});
