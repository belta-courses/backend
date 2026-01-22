import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { Prisma, Role } from 'src/generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
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

    const newUser = await this.prisma.user.create({
      data: createUserDto,
      include: { cover: true, accessGroup: true },
    });

    return newUser;
  }

  async findAll(filters: {
    page: number;
    limit: number;
    search: string;
    role?: Role | Role[];
    sortNewest?: boolean;
    accessGroupId?: string | null;
  }) {
    const { page, limit, search, role, accessGroupId } = filters;

    if (accessGroupId && role !== Role.employee) {
      return { data: [], meta: { page, limit, count: 0, total: 0 } };
    }

    let { sortNewest } = filters;
    if (sortNewest === undefined) sortNewest = true;

    const where: Prisma.UserFindManyArgs['where'] = {
      OR: [
        { email: { contains: search || '', mode: 'insensitive' } },
        { name: { contains: search || '', mode: 'insensitive' } },
      ],
      role: role
        ? Array.isArray(role)
          ? { in: role }
          : { equals: role }
        : undefined,
      accessGroupId:
        accessGroupId !== undefined
          ? {
              equals: accessGroupId,
            }
          : undefined,
    };

    const [users, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cover: true,
          accessGroup: true,
        },
        orderBy: {
          created_at: sortNewest ? 'desc' : undefined,
        },
      }),
      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      data: users,
      meta: {
        page: page,
        limit: limit,
        count: users.length,
        total: totalCount,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { cover: true, accessGroup: { include: { permissions: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneByEmail(
    email: string,
    where?: Omit<Prisma.UserFindUniqueArgs['where'], 'email' | 'id'>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email, ...where },
      include: { cover: true, accessGroup: true },
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
      include: { cover: true, accessGroup: true },
    });

    // Delete old cover file
    if (oldUser.coverId && oldUser.coverId !== user.coverId) {
      await this.storageService.deleteFile(oldUser.coverId);
    }

    return user;
  }
}
