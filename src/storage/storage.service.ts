import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StorageService {
  client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  bucket = process.env.S3_BUCKET!;

  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(file: Express.Multer.File) {
    try {
      const key = `${Date.now()}-${file.originalname}`;
      const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;

      await this.s3Upload(key, file);
      const metadata = await this.createMetaData(key, file, url);
      return { id: metadata.id, url };
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
      data: { deleted_at: new Date(), deleted: true },
    });
    return metadata;
  }
}
