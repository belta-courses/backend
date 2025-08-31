import { Injectable } from '@nestjs/common';

const hello = 'hello';
@Injectable()
export class AppService {
  getHello(): string {
    return 'Belta-Course server is working well! Thanks for checking❤️';
  }
}
