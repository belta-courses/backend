import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [StorageController],
  providers: [PrismaService, StorageService],
})
export class StorageModule {}
