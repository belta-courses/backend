import {
  BadRequestException,
  Controller,
  Delete,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import {
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadResponseDto } from './dto/response/upload-response.dto';
import { plainToInstance } from 'class-transformer';
import { Router } from 'src/core/router';

@ApiTags(Router.Storage.ApiTag)
@Controller(Router.Storage.Base)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post(Router.Storage.UploadFile)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The file has been successfully uploaded',
    type: UploadResponseDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const metadata = await this.storageService.uploadFile(file);

    return plainToInstance(UploadResponseDto, metadata, {
      excludeExtraneousValues: true,
    });
  }

  @Post(Router.Storage.UploadMultipleFiles)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The files have been successfully uploaded',
    type: [UploadResponseDto],
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const metadata = await this.storageService.uploadMultipleFiles(files);

    return plainToInstance(UploadResponseDto, metadata, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(Router.Storage.DeleteFile)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The file has been successfully deleted',
  })
  @ApiQuery({
    name: 'fileId',
    type: String,
    required: false,
  })
  async deleteFile(@Query('fileId') fileId: string) {
    await this.storageService.deleteFile(fileId);
  }

  @Delete(Router.Storage.DeleteMultipleFiles)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The files have been successfully deleted',
  })
  @ApiQuery({
    name: 'fileIds',
    type: [String],
    required: false,
  })
  async deleteMultipleFiles(@Query('fileIds') fileIds: string[] = []) {
    await this.storageService.deleteMultipleFiles(
      typeof fileIds === 'string' ? [fileIds] : fileIds,
    );
  }
}
