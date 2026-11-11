import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTenantMfaDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  mfaEnabled: boolean;
}
