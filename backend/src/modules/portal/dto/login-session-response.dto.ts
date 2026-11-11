import { ApiProperty } from '@nestjs/swagger';
import { SafeUserDto } from './safe-user.dto.js';

export class LoginSessionResponseDto extends SafeUserDto {
  @ApiProperty({ example: false })
  mfaRequired: false;
}
