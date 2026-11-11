import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { powerBiWorkspaceExample } from '../../../common/swagger/examples.js';

export class PowerBiWorkspaceDto {
  @ApiProperty({ example: powerBiWorkspaceExample.id })
  id: string;

  @ApiProperty({ example: powerBiWorkspaceExample.name })
  name: string;

  @ApiPropertyOptional()
  isOnDedicatedCapacity?: boolean;

  @ApiPropertyOptional()
  isReadOnly?: boolean;
}
