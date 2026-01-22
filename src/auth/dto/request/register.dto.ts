import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';
import { CreateUserDto } from 'src/users/dto/request/create-user.dto';

export class RegisterDto extends OmitType(CreateUserDto, ['role', 'email']) {
  @ApiProperty({
    description: 'The role of the user, only student or teacher',
    example: Role.student,
    enum: [Role.student, Role.teacher],
  })
  @IsEnum([Role.student, Role.teacher], {
    message: 'Invalid role, must be student or teacher',
  })
  role: Role;
}
