import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { createPowerBiReportExample } from '../../../common/swagger/examples.js';

export class CreatePowerBiReportDto {
  @ApiProperty({ example: createPowerBiReportExample.workspaceId, format: 'uuid' })
  @IsUUID('4')
  workspaceId: string;

  @ApiProperty({ example: createPowerBiReportExample.reportId, format: 'uuid' })
  @IsUUID('4')
  reportId: string;

  @ApiProperty({ example: createPowerBiReportExample.nome, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiPropertyOptional({
    example: createPowerBiReportExample.descricao,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;
}
