import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { powerBiPythonReportExample } from '../../../common/swagger/examples.js';

export class PowerBiPythonReportDto {
  @ApiProperty({ example: powerBiPythonReportExample.id })
  id: string;

  @ApiProperty({ example: powerBiPythonReportExample.name })
  name: string;

  @ApiPropertyOptional({ example: powerBiPythonReportExample.datasetId })
  datasetId?: string;

  @ApiPropertyOptional({ example: powerBiPythonReportExample.embedUrl })
  embedUrl?: string;
}
