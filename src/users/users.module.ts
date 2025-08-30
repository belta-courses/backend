import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [UsersController],
  providers: [PrismaService, MailService, UsersService],
})
export class UsersModule {}
