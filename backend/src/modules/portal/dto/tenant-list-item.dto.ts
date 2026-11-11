import { ApiProperty } from '@nestjs/swagger';
import { tenantListItemExample } from '../../../common/swagger/examples.js';

export class TenantListItemDto {
  @ApiProperty({ example: tenantListItemExample.id })
  id: string;

  @ApiProperty({ example: tenantListItemExample.name })
  name: string;

  @ApiProperty({ example: tenantListItemExample.slug })
  slug: string;
}
