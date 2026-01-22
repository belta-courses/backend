import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JWTPurposeGuard } from './jwt-purpose.guard';
import { JwtPayload, JwtPurpose } from 'src/users/users.types';
import { JWT_PURPOSE_KEY } from './jwt-purpose.decorator';
import { Role } from 'src/generated/prisma/client';

describe('JWTPurposeGuard', () => {
  let guard: JWTPurposeGuard;
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
        JWTPurposeGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JWTPurposeGuard>(JWTPurposeGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no purpose is required (decorator not set)', () => {
      const user: JwtPayload = {
        sub: '123',
        email: 'test@example.com',
        role: Role.student,
        purpose: JwtPurpose.Register,
      };
      const context = mockExecutionContext(user);

      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(
        JWT_PURPOSE_KEY,
        expect.any(Array),
      );
    });

    it('should return true when user purpose matches one of multiple required purposes', () => {
      const user: JwtPayload = {
        sub: '123',
        email: 'test@example.com',
        role: Role.student,
        purpose: JwtPurpose.Register,
      };
      const context = mockExecutionContext(user);

      // Even though we only have one JwtPurpose value, this tests the array logic
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([JwtPurpose.Register]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user purpose does not match required purpose', () => {
      const user: JwtPayload = {
        sub: '123',
        email: 'test@example.com',
        role: Role.student,
        purpose: null,
      };
      const context = mockExecutionContext(user);

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([JwtPurpose.Register]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user purpose is null and purpose is required', () => {
      const user: JwtPayload = {
        sub: '123',
        email: 'test@example.com',
        role: Role.admin,
        purpose: null,
      };
      const context = mockExecutionContext(user);

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([JwtPurpose.Register]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
