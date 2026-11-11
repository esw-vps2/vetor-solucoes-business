import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MfaCancelDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  challengeId: string;
}
