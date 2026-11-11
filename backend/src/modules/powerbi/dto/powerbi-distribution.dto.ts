import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { powerBiDistributionExample } from '../../../common/swagger/examples.js';

export class PowerBiDistributionDto {
  @ApiProperty({ example: powerBiDistributionExample.id })
  id: string;

  @ApiProperty({ example: powerBiDistributionExample.relatorioId })
  relatorioId: string;

  @ApiProperty({ example: powerBiDistributionExample.tenantId })
  tenantId: string;

  @ApiProperty({ example: powerBiDistributionExample.tenantName })
  tenantName: string;

  @ApiProperty({ example: powerBiDistributionExample.tenantSlug })
  tenantSlug: string;

  @ApiPropertyOptional({
    example: powerBiDistributionExample.nomeExibicao,
    nullable: true,
  })
  nomeExibicao: string | null;

  @ApiPropertyOptional({
    example: powerBiDistributionExample.icone,
    nullable: true,
  })
  icone: string | null;

  @ApiProperty({ example: powerBiDistributionExample.ordem })
  ordem: number;

  @ApiPropertyOptional({
    example: powerBiDistributionExample.paginaPadrao,
    nullable: true,
  })
  paginaPadrao: string | null;

  @ApiProperty({ example: powerBiDistributionExample.ativo })
  ativo: boolean;
}
