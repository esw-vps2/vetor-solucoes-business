import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { updatePowerBiReportExample } from '../../../common/swagger/examples.js';

export class UpdatePowerBiReportDto {
  @ApiPropertyOptional({ example: updatePowerBiReportExample.nome, maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome?: string;

  @ApiPropertyOptional({
    example: updatePowerBiReportExample.descricao,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;
}
