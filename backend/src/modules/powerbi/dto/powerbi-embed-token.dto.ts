import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { powerBiEmbedTokenExample } from '../../../common/swagger/examples.js';

export class PowerBiEmbedTokenDto {
  @ApiProperty({ example: powerBiEmbedTokenExample.id })
  id: string;

  @ApiProperty({ example: powerBiEmbedTokenExample.nome })
  nome: string;

  @ApiProperty({ example: powerBiEmbedTokenExample.embedUrl })
  embedUrl: string;

  @ApiProperty({ example: powerBiEmbedTokenExample.embedToken })
  embedToken: string;

  @ApiProperty({ example: powerBiEmbedTokenExample.expiration })
  expiration: string;

  @ApiPropertyOptional({
    example: powerBiEmbedTokenExample.paginaPadrao,
    nullable: true,
  })
  paginaPadrao: string | null;
}
