import { PartialType } from '@nestjs/swagger';
import { CreateAccessGroupDto } from './create-access-group.dto';

export class UpdateAccessGroupDto extends PartialType(CreateAccessGroupDto) {}
