import { ApiProperty } from '@nestjs/swagger';
import { tenantCreatedExample } from '../../../common/swagger/examples.js';

export class TenantCreatedDto {
  @ApiProperty({ example: tenantCreatedExample.id, format: 'uuid' })
  id: string;

  @ApiProperty({ example: tenantCreatedExample.name })
  name: string;

  @ApiProperty({ example: tenantCreatedExample.slug })
  slug: string;

  @ApiProperty({
    example: tenantCreatedExample.email,
    nullable: true,
    type: String,
  })
  email: string | null;
}
