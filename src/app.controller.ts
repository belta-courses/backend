import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Router } from './core/router';

@ApiTags(Router.App.ApiTag)
@Controller(Router.App.Base)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: 'Belta-Course server is working well! Thanks for checking❤️',
  })
  @Get(Router.App.Health)
  getHello(): string {
    return this.appService.getHello();
  }
}
