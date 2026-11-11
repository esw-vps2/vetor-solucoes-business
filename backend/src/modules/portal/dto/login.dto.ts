import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { loginExample } from '../../../common/swagger/examples.js';

export class LoginDto {
  @ApiProperty({ example: loginExample.email, maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: loginExample.password, maxLength: 128 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  password: string;
}
