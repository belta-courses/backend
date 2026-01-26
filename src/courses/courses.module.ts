import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { ModulesController } from './modules.controller';
import { LecturesController } from './lectures.controller';
import { CoursesService } from './courses.service';
import { PrismaService } from 'src/prisma.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [CoursesController, ModulesController, LecturesController],
  providers: [CoursesService, PrismaService],
  exports: [CoursesService],
})
export class CoursesModule {}
