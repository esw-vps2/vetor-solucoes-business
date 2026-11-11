import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { powerBiCatalogReportExample } from '../../../common/swagger/examples.js';

export class PowerBiCatalogReportDto {
  @ApiProperty({ example: powerBiCatalogReportExample.id })
  id: string;

  @ApiProperty({ example: powerBiCatalogReportExample.workspaceId })
  workspaceId: string;

  @ApiProperty({ example: powerBiCatalogReportExample.reportId })
  reportId: string;

  @ApiProperty({ example: powerBiCatalogReportExample.datasetId })
  datasetId: string;

  @ApiProperty({ example: powerBiCatalogReportExample.embedUrl })
  embedUrl: string;

  @ApiProperty({ example: powerBiCatalogReportExample.nome })
  nome: string;

  @ApiPropertyOptional({
    example: powerBiCatalogReportExample.descricao,
    nullable: true,
  })
  descricao: string | null;

  @ApiProperty({ example: powerBiCatalogReportExample.ativo })
  ativo: boolean;
}
