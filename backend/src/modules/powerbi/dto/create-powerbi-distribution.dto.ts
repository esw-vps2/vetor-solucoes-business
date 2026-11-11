import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { createPowerBiDistributionExample } from '../../../common/swagger/examples.js';

export class CreatePowerBiDistributionDto {
  @ApiProperty({
    example: createPowerBiDistributionExample.tenantId,
    format: 'uuid',
  })
  @IsUUID('4')
  tenantId: string;

  @ApiPropertyOptional({
    example: createPowerBiDistributionExample.nomeExibicao,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nomeExibicao?: string;

  @ApiPropertyOptional({
    example: createPowerBiDistributionExample.icone,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icone?: string;

  @ApiPropertyOptional({ example: createPowerBiDistributionExample.ordem })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ordem?: number;

  @ApiPropertyOptional({
    example: createPowerBiDistributionExample.paginaPadrao,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paginaPadrao?: string;
}
