import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/config/config.type';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StorageService {
  client: S3Client;
  bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AllConfig>,
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

  async getFile(id: string) {
    const metadata = await this.prisma.file.findUnique({
      where: { id },
    });
    return metadata;
  }

  async uploadFile(file: Express.Multer.File) {
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
    const metadata = await this.prisma.file.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return metadata;
  }
}
