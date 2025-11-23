import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { PrismaService } from 'src/prisma.service';
import { BullModule } from '@nestjs/bullmq';
import StorageProcessor from './storage.processor';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'storage',
    }),
    BullBoardModule.forFeature({
      name: 'storage',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    }),
  ],
  controllers: [StorageController],
  providers: [PrismaService, StorageService, StorageProcessor],
  exports: [BullModule],
})
export class StorageModule {}
