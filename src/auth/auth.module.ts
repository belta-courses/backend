import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { jwtConstants } from 'src/config/constants.config';
import { UsersModule } from 'src/users/users.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, PrismaService],
})
export class AuthModule {}
