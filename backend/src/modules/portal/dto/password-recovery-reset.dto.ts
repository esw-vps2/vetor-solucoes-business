import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { passwordRecoveryResetExample } from '../../../common/swagger/examples.js';
import {
  IsNewPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_POLICY_DESCRIPTION,
} from '../password-policy.js';

export class PasswordRecoveryResetDto {
  @ApiPropertyOptional({
    example: passwordRecoveryResetExample.email,
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: passwordRecoveryResetExample.token })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  token: string;

  @ApiProperty({
    description: PASSWORD_POLICY_DESCRIPTION,
    example: passwordRecoveryResetExample.password,
    maxLength: PASSWORD_MAX_LENGTH,
    minLength: PASSWORD_MIN_LENGTH,
    pattern: PASSWORD_PATTERN.source,
  })
  @IsNewPassword()
  password: string;

  @ApiProperty({
    description: PASSWORD_POLICY_DESCRIPTION,
    example: passwordRecoveryResetExample.passwordConfirmation,
    maxLength: PASSWORD_MAX_LENGTH,
    minLength: PASSWORD_MIN_LENGTH,
    pattern: PASSWORD_PATTERN.source,
  })
  @IsNewPassword()
  passwordConfirmation: string;
}
