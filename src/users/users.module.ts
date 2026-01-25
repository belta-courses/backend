import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/core/constants/auth.constants';
import { StorageService } from 'src/storage/storage.service';
import { StorageModule } from 'src/storage/storage.module';
import { AuthService } from 'src/auth/auth.service';
import { MailService } from 'src/mail/mail.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
    }),
    StorageModule,
  ],
  controllers: [UsersController],
  providers: [
    PrismaService,
    UsersService,
    StorageService,
    AuthService,
    MailService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
