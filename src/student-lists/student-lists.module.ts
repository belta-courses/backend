import { Module } from '@nestjs/common';
import { StudentListsController } from './student-lists.controller';
import { StudentListsService } from './student-lists.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [StudentListsController],
  providers: [StudentListsService, PrismaService],
  exports: [StudentListsService],
})
export class StudentListsModule {}

