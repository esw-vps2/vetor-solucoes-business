import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,128}$/;
export const PASSWORD_POLICY_DESCRIPTION =
  'At least 6 characters, including a letter, a number, and a special character.';

export function IsNewPassword() {
  return applyDecorators(
    IsString(),
    MinLength(PASSWORD_MIN_LENGTH),
    MaxLength(PASSWORD_MAX_LENGTH),
    Matches(PASSWORD_PATTERN, {
      message: `password must have ${PASSWORD_POLICY_DESCRIPTION.toLowerCase()}`,
    }),
  );
}
