import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGuard, { provide: JwtService, useValue: {} }],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
