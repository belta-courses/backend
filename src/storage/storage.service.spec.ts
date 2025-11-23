import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';
import { STORAGE_QUEUE } from 'src/core/constants/queues.constants';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: {} },
        {
          provide: ConfigService<AllConfig>,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: `BullQueue_${STORAGE_QUEUE}`,
          useValue: {
            add: jest.fn(),
          },
        },
        StorageService,
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
