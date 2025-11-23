import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/core/config/constants.config';
import { StorageService } from 'src/storage/storage.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
    }),
    StorageModule,
  ],
  controllers: [UsersController],
  providers: [PrismaService, UsersService, StorageService],
  exports: [UsersService],
})
export class UsersModule {}
