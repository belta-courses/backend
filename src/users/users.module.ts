import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/lib/config/constants';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
    }),
  ],
  controllers: [UsersController],
  providers: [PrismaService, JwtService, MailService, UsersService],
})
export class UsersModule {}
