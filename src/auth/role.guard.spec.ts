import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './role.guard';
import { ROLES_KEY } from './roles.decorator';
import { JwtPayload, JwtPurpose } from 'src/users/types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required (decorator not set)', () => {
      const user: JwtPayload = {
        sub: '123',
        role: Role.student,
        purpose: null,
      };
      const context = mockExecutionContext(user);

      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(
        ROLES_KEY,
        expect.any(Array),
      );
    });

    it('should return true when user role matches required role', () => {
      const user: JwtPayload = {
        sub: '123',
        role: Role.admin,
        purpose: null,
      };
      const context = mockExecutionContext(user);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.admin]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user role matches one of multiple required roles', () => {
      const user: JwtPayload = {
        sub: '123',
        role: Role.teacher,
        purpose: null,
      };
      const context = mockExecutionContext(user);

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.admin, Role.teacher, Role.employee]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user role does not match required role', () => {
      const user: JwtPayload = {
        sub: '123',
        role: Role.student,
        purpose: null,
      };
      const context = mockExecutionContext(user);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.admin]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user role is null and role is required', () => {
      const user: JwtPayload = {
        sub: '123',
        role: null,
        purpose: JwtPurpose.Register,
      };
      const context = mockExecutionContext(user);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.admin]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
