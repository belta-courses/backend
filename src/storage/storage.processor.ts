import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { StorageService } from './storage.service';
import { PrismaService } from 'src/prisma.service';
import { STORAGE_QUEUE } from 'src/core/constants/queues.constants';

@Processor(STORAGE_QUEUE, { concurrency: 5 })
class StorageProcessor extends WorkerHost {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }
  async process(job: Job<{ id: string }>, _token?: string) {
    await job.updateProgress(0);

    // Search for files to delete
    const files = await this.prisma.file.findMany({
      where: {
        deleted_at: {
          not: null,
        },
      },
    });
    await job.updateProgress(50);
    await job.log(`🔍 Found ${files.length} files to delete`);

    // Delete Files
    for (const file of files) {
      try {
        await this.storageService.hardDelete(file.id, file.key);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        await job.log(`❌ Error deleting file ${file.id}: ${message}`);
      }
    }
    await job.updateProgress(100);
    await job.log(`✅ Deleted ${files.length} files`);

    return { success: true };
  }
}

export default StorageProcessor;
