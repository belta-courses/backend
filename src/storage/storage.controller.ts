import {
  Controller,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadResponseDto } from './dto/response/upload-response.dto';
import { plainToInstance } from 'class-transformer';
import { Router } from 'src/core/router';

@ApiTags(Router.Storage.ApiTag)
@Controller(Router.Storage.Base)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

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
  @Post(Router.Storage.UploadFile)
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const metadata = await this.storageService.uploadFile(file);

    return plainToInstance(UploadResponseDto, metadata, {
      excludeExtraneousValues: true,
    });
  }
}
