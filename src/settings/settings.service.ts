import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateSettingDto } from './dto/request/update-setting.dto';
import { PROFIT_SETTING_KEY } from 'src/core/constants/settings.constants';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.setting.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateById(id: string, dto: UpdateSettingDto) {
    const setting = await this.prisma.setting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with id ${id} not found`);
    }

    return this.prisma.setting.update({
      where: { id },
      data: dto,
    });
  }

  async getTeacherProfit(): Promise<number> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: PROFIT_SETTING_KEY },
    });

    if (!setting) {
      throw new NotFoundException(`${PROFIT_SETTING_KEY} Setting is not found`);
    }

    return parseFloat(setting.value);
  }
}
