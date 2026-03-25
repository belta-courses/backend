import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { StorageService } from './storage.service';
import { PrismaService } from 'src/prisma.service';
import { STORAGE_QUEUE } from 'src/core/constants/queues.constants';
import { INACTIVE_TIME_TO_ABBORFT_UPLOAD } from 'src/core/constants/storage.constants';

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

    // Search for incomplete uploads

    const imcompleteUploads = await this.prisma.multiPartUpload.findMany({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - INACTIVE_TIME_TO_ABBORFT_UPLOAD),
        },
      },
    });
    await job.updateProgress(25);
    await job.log(`🔍 Found ${imcompleteUploads.length} incomplete uploads`);

    // Abort incomplete uploads
    for (const upload of imcompleteUploads) {
      await this.storageService.abortVideoUpload(upload.id);
    }
    await job.updateProgress(50);
    await job.log(`✅ Aborted ${imcompleteUploads.length} incomplete uploads`);

    // Search for files to delete
    const files = await this.prisma.file.findMany({
      where: {
        deleted_at: {
          not: null,
        },
      },
    });
    await job.updateProgress(75);
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
