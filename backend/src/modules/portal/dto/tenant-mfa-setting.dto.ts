import { ApiProperty } from '@nestjs/swagger';

export class TenantMfaSettingDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Acme' })
  name: string;

  @ApiProperty({ example: 'acme' })
  slug: string;

  @ApiProperty({ example: false })
  mfaEnabled: boolean;

  @ApiProperty({ example: 0.6 })
  aiTokenCostPerMillion: number;
}
