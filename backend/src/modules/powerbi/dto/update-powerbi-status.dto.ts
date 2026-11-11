import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { powerBiStatusExample } from '../../../common/swagger/examples.js';

export class UpdatePowerBiStatusDto {
  @ApiProperty({ example: powerBiStatusExample.ativo })
  @IsBoolean()
  ativo: boolean;
}
