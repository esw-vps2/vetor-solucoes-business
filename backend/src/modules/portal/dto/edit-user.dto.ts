import { ApiProperty } from '@nestjs/swagger';
import { SafeUserDto } from './safe-user.dto.js';

export class EditUserDto extends SafeUserDto {
  @ApiProperty({ example: 'blocked' })
  status: string;
}
