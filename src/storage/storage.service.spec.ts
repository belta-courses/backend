import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { PrismaService } from 'src/prisma.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: PrismaService, useValue: {} }, StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
