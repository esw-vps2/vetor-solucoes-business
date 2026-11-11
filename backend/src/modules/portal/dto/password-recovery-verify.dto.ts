import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { passwordRecoveryVerifyExample } from '../../../common/swagger/examples.js';

export class PasswordRecoveryVerifyDto {
  @ApiPropertyOptional({
    example: passwordRecoveryVerifyExample.email,
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: passwordRecoveryVerifyExample.token })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  token: string;
}
