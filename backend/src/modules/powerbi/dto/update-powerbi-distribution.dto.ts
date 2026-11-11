import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { updatePowerBiDistributionExample } from '../../../common/swagger/examples.js';

export class UpdatePowerBiDistributionDto {
  @ApiPropertyOptional({
    example: updatePowerBiDistributionExample.nomeExibicao,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nomeExibicao?: string;

  @ApiPropertyOptional({
    example: updatePowerBiDistributionExample.icone,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icone?: string;

  @ApiPropertyOptional({ example: updatePowerBiDistributionExample.ordem })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ordem?: number;

  @ApiPropertyOptional({
    example: updatePowerBiDistributionExample.paginaPadrao,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paginaPadrao?: string;
}
