import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';
import { PrismaService } from 'src/prisma.service';
import { File } from 'src/generated/prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { STORAGE_QUEUE } from 'src/core/constants/queues.constants';
import { InitVideoUploadDto } from './dto/request/init-video-upload.dto';
import { UploadVideoPartDto } from './dto/request/upload-video-part.dto';
import {
  MAX_PART_RETRIES,
  VIDEO_PART_SIZE,
} from 'src/core/constants/storage.constants';

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

  genFileKey(name: string) {
    return `${Date.now()}-${name}`;
  }
  getFileUrl(key: string) {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async uploadFile(file: Express.Multer.File): Promise<File> {
    try {
      const key = this.genFileKey(file.originalname);
      const url = this.getFileUrl(key);

      await this.s3Upload(key, file);
      const metadata = await this.createMetaData(key, file, url);
      return metadata;
    } catch (ignore) {
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<File[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
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

  async deleteFile(id: string): Promise<File> {
    console.log(id);
    const file = await this.prisma.file.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return file;
  }

  async deleteMultipleFiles(ids: string[]): Promise<File[]> {
    const files = await this.prisma.file.updateManyAndReturn({
      where: { id: { in: ids } },
      data: { deleted_at: new Date() },
    });
    return files;
  }

  async hardDelete(id: string, key: string) {
    await this.s3Delete(key);

    await this.prisma.file.delete({
      where: { id },
    });
  }

  // Video Services
  async initVideoUpload(dto: InitVideoUploadDto) {
    const key = this.genFileKey(dto.name);

    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const res = await this.client.send(command);
    const { UploadId } = res;

    if (!UploadId)
      throw new InternalServerErrorException(
        'Failed to create multipart upload',
      );

    const file = await this.prisma.file.create({
      data: {
        key,
        name: dto.name,
        size: dto.size,
        mime_type: 'video/mp4',
        bucket: this.bucket,
        url: this.getFileUrl(key),
      },
    });

    const partsCount = Math.ceil(dto.size / VIDEO_PART_SIZE);

    const upload = await this.prisma.multiPartUpload.create({
      data: {
        uploadId: UploadId,
        fileId: file.id,
        fileSize: dto.size,
        partsCount: partsCount,
      },
    });

    return {
      uploadId: upload.id,
      partsCount: partsCount,
      partSize: VIDEO_PART_SIZE,
    };
  }

  async uploadVideoPart(dto: UploadVideoPartDto, file: Express.Multer.File) {
    const { id, partNumber } = dto;
    const upload = await this.prisma.multiPartUpload.findUnique({
      where: { id },
      include: {
        file: true,
      },
    });
    if (!upload) throw new NotFoundException('Upload not found');

    try {
      if (upload.partsCompleted >= upload.partsCount)
        throw new BadRequestException('Upload already completed');
      if (upload.partsCompleted + 1 !== partNumber)
        throw new BadRequestException('Part number is not the next part');
      if (upload.retries >= MAX_PART_RETRIES)
        throw new BadRequestException('Upload failed too many times');
      if (upload.partsCompleted + 1 > upload.partsCount)
        throw new BadRequestException(
          'Part number is greater than the total parts',
        );

      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: upload.file.key,
        PartNumber: partNumber,
        UploadId: upload.uploadId,
        Body: file.buffer,
      });

      const { ETag } = await this.client.send(command);

      if (!ETag)
        throw new InternalServerErrorException('Failed to upload part');

      await this.prisma.uploadedPart.create({
        data: {
          uploadRecordId: upload.id,
          partNumber: partNumber,
          etag: ETag,
        },
      });

      // Check Complete
      if (upload.partsCompleted + 1 === upload.partsCount) {
        const uploadedParts = await this.prisma.uploadedPart.findMany({
          where: { uploadRecordId: upload.id },
          orderBy: { partNumber: 'asc' },
        });
        if (uploadedParts.length !== upload.partsCount)
          throw new InternalServerErrorException('Failed to upload parts');

        const completeCommand = new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: upload.file.key,
          UploadId: upload.uploadId,
          MultipartUpload: {
            Parts: uploadedParts.map((part) => ({
              ETag: part.etag,
              PartNumber: part.partNumber,
            })),
          },
        });

        await this.client.send(completeCommand);

        await this.prisma.uploadedPart.deleteMany({
          where: { uploadRecordId: id },
        });

        await this.prisma.multiPartUpload.delete({
          where: { id },
        });

        return {
          uploadId: upload.id,
          uploadStatus: 'completed',
          completedParts: upload.partsCompleted + 1,
          totalParts: upload.partsCount,
          partSize: VIDEO_PART_SIZE,
          file: upload.file,
        };
      }

      await this.prisma.multiPartUpload.update({
        where: { id },
        data: { partsCompleted: upload.partsCompleted + 1 },
      });

      return {
        uploadId: upload.id,
        uploadStatus: 'ongoing',
        completedParts: upload.partsCompleted + 1,
        totalParts: upload.partsCount,
        partSize: VIDEO_PART_SIZE,
        file: upload.file,
      };
    } catch (error) {
      if (upload.retries >= MAX_PART_RETRIES - 1) {
        await this.prisma.multiPartUpload.delete({
          where: { id },
        });
        throw new BadRequestException('TOO_MEANY_RETRIES');
      }

      // increase fail retries
      await this.prisma.multiPartUpload.update({
        where: { id },
        data: { retries: upload.retries + 1 },
      });

      throw error;
    }
  }

  async abortVideoUpload(id: string) {
    await this.prisma.uploadedPart.deleteMany({
      where: { uploadRecordId: id },
    });

    const upload = await this.prisma.multiPartUpload.findUnique({
      where: { id },
      include: {
        file: true,
      },
    });
    if (!upload) throw new NotFoundException('Upload not found');

    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: upload.file.key,
      UploadId: upload.uploadId,
    });

    await this.client.send(command);

    await this.prisma.file.update({
      where: { id: upload.fileId },
      data: { deleted_at: new Date() },
    });

    await this.prisma.multiPartUpload.delete({
      where: { id },
    });

    await this.prisma.uploadedPart.deleteMany({
      where: { uploadRecordId: id },
    });
  }
}
