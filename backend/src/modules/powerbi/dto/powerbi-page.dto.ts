import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { powerBiPageExample } from '../../../common/swagger/examples.js';

export class PowerBiPageDto {
  @ApiProperty({ example: powerBiPageExample.name })
  name: string;

  @ApiProperty({ example: powerBiPageExample.displayName })
  displayName: string;

  @ApiPropertyOptional({ example: powerBiPageExample.order })
  order?: number;
}
