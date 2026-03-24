import {
  Body,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Router } from 'src/core/router';
import { StorageService } from './storage.service';
import { InitVideoUploadDto } from './dto/request/init-video-upload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadVideoPartDto } from './dto/request/upload-video-part.dto';

@ApiTags(Router.Video.ApiTag)
@Controller(Router.Video.Base)
export class VideoController {
  constructor(private readonly storageService: StorageService) {}

  @ApiBody({
    type: InitVideoUploadDto,
  })
  @Post(Router.Video.InitUpload)
  async initUpload(@Body() dto: InitVideoUploadDto) {
    return this.storageService.initVideoUpload(dto);
  }

  @Post(Router.Video.UploadVideoPart)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        partNumber: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPart(
    @Body() dto: UploadVideoPartDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadVideoPart(dto, file);
  }

  @Post(Router.Video.AbortUpload)
  async abortUpload(@Query('id') id: string) {
    return this.storageService.abortVideoUpload(id);
  }
}
