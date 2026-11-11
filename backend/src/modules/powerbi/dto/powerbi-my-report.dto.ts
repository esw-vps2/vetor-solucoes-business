import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { powerBiMyReportExample } from '../../../common/swagger/examples.js';

export class PowerBiMyReportCatalogDto {
  @ApiProperty({ example: powerBiMyReportExample.relatorio.id })
  id: string;

  @ApiProperty({ example: powerBiMyReportExample.relatorio.nome })
  nome: string;

  @ApiPropertyOptional({
    example: powerBiMyReportExample.relatorio.descricao,
    nullable: true,
  })
  descricao: string | null;
}

export class PowerBiMyReportDto {
  @ApiProperty({ example: powerBiMyReportExample.id })
  id: string;

  @ApiPropertyOptional({
    example: powerBiMyReportExample.nomeExibicao,
    nullable: true,
  })
  nomeExibicao: string | null;

  @ApiPropertyOptional({
    example: powerBiMyReportExample.icone,
    nullable: true,
  })
  icone: string | null;

  @ApiProperty({ example: powerBiMyReportExample.ordem })
  ordem: number;

  @ApiPropertyOptional({
    example: powerBiMyReportExample.paginaPadrao,
    nullable: true,
  })
  paginaPadrao: string | null;

  @ApiProperty({ example: powerBiMyReportExample.tenantId })
  tenantId: string;

  @ApiProperty({ type: PowerBiMyReportCatalogDto })
  relatorio: PowerBiMyReportCatalogDto;
}
