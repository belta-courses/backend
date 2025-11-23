import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './users.types';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly storageService: StorageService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const cover = createUserDto.coverId
      ? await this.storageService.getFile(createUserDto.coverId)
      : null;

    if (createUserDto.coverId && !cover) {
      throw new NotFoundException('Cover not found');
    }

    const newUser = await this.prisma.user.create({ data: createUserDto });
    const payload: JwtPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      purpose: null,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return { ...newUser, accessToken, coverId: undefined, cover: cover?.url };
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const oldUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!oldUser) {
      throw new NotFoundException('User not found');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // Delete old cover file
    if (oldUser.coverId && oldUser.coverId !== user.coverId) {
      await this.storageService.deleteFile(oldUser.coverId);
    }

    return user;
  }
}
