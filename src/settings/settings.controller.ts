import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Router } from 'src/core/router';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/request/update-setting.dto';
import { SettingResponseDto } from './dto/response/setting-response.dto';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from 'src/auth/roles.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { AccessedBy } from 'src/auth/permissions.decorator';
import { Permission } from 'src/core/config/permissions.config';

@ApiTags(Router.Settings.ApiTag)
@Controller(Router.Settings.Base)
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.admin, Role.employee)
@AccessedBy(Permission.SETTINGS_FULL_ACCESS)
@ApiBearerAuth(Router.Integrated.ApiAuthName)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all settings ordered by creation date (oldest first)',
  })
  async findAll() {
    const settings = await this.settingsService.findAll();
    return plainToInstance(SettingResponseDto, settings, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(Router.Settings.ById)
  @ApiOperation({ summary: 'Update a setting by id' })
  @HttpCode(HttpStatus.OK)
  async updateById(@Param('id') id: string, @Body() dto: UpdateSettingDto) {
    const setting = await this.settingsService.updateById(id, dto);
    return plainToInstance(SettingResponseDto, setting, {
      excludeExtraneousValues: true,
    });
  }
}
