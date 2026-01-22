import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';
import { PrismaService } from 'src/prisma.service';
import { File } from 'src/generated/prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { STORAGE_QUEUE } from 'src/core/constants/queues.constants';

@Injectable()
export class StorageService implements OnModuleInit {
  client: S3Client;
  bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AllConfig>,
    @InjectQueue(STORAGE_QUEUE) private readonly mq: Queue,
  ) {
    this.client = new S3Client({
      region: this.configService.getOrThrow('s3.region', {
        infer: true,
      }),
      credentials: {
        accessKeyId: this.configService.getOrThrow('s3.accessKeyId', {
          infer: true,
        }),
        secretAccessKey: this.configService.getOrThrow('s3.secretAccessKey', {
          infer: true,
        }),
      },
    });
    this.bucket = this.configService.getOrThrow('s3.bucket', { infer: true });
  }

  async onModuleInit() {
    // Schedule storage cleanup to run every week (Sunday at midnight)
    await this.mq.add(
      'cleanup',
      { id: 'weekly-cleanup' },
      {
        repeat: {
          pattern: '0 0 * * 0', // Every Sunday at 00:00
        },
        jobId: 'weekly-storage-cleanup',
      },
    );
  }

  async getFile(id: string) {
    const metadata = await this.prisma.file.findUnique({
      where: { id },
    });
    return metadata;
  }

  async uploadFile(file: Express.Multer.File): Promise<File> {
    try {
      const key = `${Date.now()}-${file.originalname}`;
      const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;

      await this.s3Upload(key, file);
      const metadata = await this.createMetaData(key, file, url);
      return metadata;
    } catch (ignore) {
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async s3Upload(key: string, file: Express.Multer.File) {
    const command = new PutObjectCommand({
      Key: key,
      Bucket: this.bucket,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    const res = await this.client.send(command);
    return res;
  }

  async s3Delete(key: string) {
    const command = new DeleteObjectCommand({
      Key: key,
      Bucket: this.bucket,
    });
    const res = await this.client.send(command);
    return res;
  }

  async createMetaData(key: string, file: Express.Multer.File, url: string) {
    const metadata = await this.prisma.file.create({
      data: {
        key,
        name: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        bucket: this.bucket,
        url,
      },
    });
    return metadata;
  }

  async deleteFile(id: string) {
    await this.prisma.file.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async hardDelete(id: string, key: string) {
    await this.s3Delete(key);

    await this.prisma.file.delete({
      where: { id },
    });
  }
}
