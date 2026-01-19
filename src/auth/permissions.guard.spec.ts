import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessGroup, Role } from '@prisma/client';
import { JwtPayload } from 'src/users/users.types';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Permission } from 'src/core/config/permissions.config';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prismaService: PrismaService;
  let usersService: UsersService;

  const mockExecutionContext = (user: JwtPayload): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  const mockAccessGroup = {
    id: '1',
    name: 'Test Group',
    description: 'Test Description',
    created_at: new Date(),
    updated_at: new Date(),
    permissions: [
      {
        id: '1',
        key: Permission.USERS_READ,
        accessGroupId: '1',
        created_at: new Date(),
      },
      {
        id: '2',
        key: Permission.USERS_UPDATE,
        accessGroupId: '1',
        created_at: new Date(),
      },
    ],
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: Role.employee,
    accessGroupId: mockAccessGroup.id,
    accessGroup: mockAccessGroup,
    name: 'Test User',
    coverId: null,
    cover: null,
    bio: null,
    gender: null,
    date_of_birth: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: PrismaService,
          useValue: {
            accessGroup: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no permissions are required', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'test@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        [expect.any(Object), expect.any(Object)],
      );
    });

    it('should return true for admin users regardless of permissions', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'admin@example.com',
        role: Role.admin,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_DELETE]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(usersService.findOne).not.toHaveBeenCalled();
    });

    it('should return true for student users when permissions are required', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'student@example.com',
        role: Role.student,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(usersService.findOne).not.toHaveBeenCalled();
    });

    it('should return true for teacher users when permissions are required', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'teacher@example.com',
        role: Role.teacher,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(usersService.findOne).not.toHaveBeenCalled();
    });

    it('should return false for employee without access group', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      jest.spyOn(usersService, 'findOne').mockResolvedValue({
        ...mockUser,
        accessGroupId: null,
        accessGroup: null,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(usersService.findOne).toHaveBeenCalledWith('1');
      expect(prismaService.accessGroup.findUnique).not.toHaveBeenCalled();
    });

    it('should return true for employee with matching permission', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      jest
        .spyOn(prismaService.accessGroup, 'findUnique')
        .mockResolvedValue(mockAccessGroup);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(usersService.findOne).toHaveBeenCalledWith('1');
      expect(prismaService.accessGroup.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { permissions: true },
      });
    });

    it('should return true for employee with at least one matching permission', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([
          Permission.USERS_READ,
          Permission.USERS_CREATE,
          Permission.USERS_DELETE,
        ]);

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      jest
        .spyOn(prismaService.accessGroup, 'findUnique')
        .mockResolvedValue(mockAccessGroup);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false for employee without matching permissions', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_DELETE]);

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      jest
        .spyOn(prismaService.accessGroup, 'findUnique')
        .mockResolvedValue(mockAccessGroup);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when access group does not exist', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      jest
        .spyOn(prismaService.accessGroup, 'findUnique')
        .mockResolvedValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when access group has no permissions', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      jest.spyOn(prismaService.accessGroup, 'findUnique').mockResolvedValue({
        ...mockAccessGroup,
        permissions: [],
      } as AccessGroup);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user service throws an error', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      jest
        .spyOn(usersService, 'findOne')
        .mockRejectedValue(new Error('User not found'));

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when prisma service throws an error', async () => {
      const context = mockExecutionContext({
        sub: '1',
        email: 'employee@example.com',
        role: Role.employee,
        purpose: null,
        iat: Date.now(),
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.USERS_READ]);

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      jest
        .spyOn(prismaService.accessGroup, 'findUnique')
        .mockRejectedValue(new Error('Database error'));

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
