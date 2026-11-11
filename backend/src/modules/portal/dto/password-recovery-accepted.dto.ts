import { ApiProperty } from '@nestjs/swagger';
import { passwordRecoveryAcceptedExample } from '../../../common/swagger/examples.js';

export class PasswordRecoveryAcceptedDto {
  @ApiProperty({ example: passwordRecoveryAcceptedExample.message })
  message: string;
}
