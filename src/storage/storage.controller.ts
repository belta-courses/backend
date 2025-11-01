import {
  Controller,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { UploadResponseDto } from './dto/response/upload-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return plainToInstance(
      UploadResponseDto,
      this.storageService.uploadFile(file),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
