import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { passwordRecoveryRequestExample } from '../../../common/swagger/examples.js';

export class PasswordRecoveryRequestDto {
  @ApiProperty({
    example: passwordRecoveryRequestExample.email,
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;
}
