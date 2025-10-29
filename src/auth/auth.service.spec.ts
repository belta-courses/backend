import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AllConfig } from 'src/config/config.type';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: MailService, useValue: {} },
        {
          provide: ConfigService<AllConfig>,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
