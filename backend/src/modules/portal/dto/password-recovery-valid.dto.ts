import { ApiProperty } from '@nestjs/swagger';

export class PasswordRecoveryValidDto {
  @ApiProperty({ example: true })
  valid: true;
}
