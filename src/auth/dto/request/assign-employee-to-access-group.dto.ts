import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AssignEmployeeToAccessGroupDto {
  @ApiProperty({
    description: 'The email of the employee',
    example: 'employee@beltacourses.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
