import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { safeUserExample } from '../../../common/swagger/examples.js';

export class SafeUserDto {
  @ApiProperty({ example: safeUserExample.id })
  id: string;

  @ApiProperty({ example: safeUserExample.email })
  email: string;

  @ApiProperty({ example: safeUserExample.profile })
  profile: string;

  @ApiProperty({ example: safeUserExample.firstName })
  firstName: string;

  @ApiProperty({ example: safeUserExample.lastName })
  lastName: string;

  @ApiPropertyOptional({ example: 'Product Manager' })
  cargo?: string;

  @ApiProperty({ example: safeUserExample.age })
  age: number;

  @ApiProperty({ example: safeUserExample.sex })
  sex: string;

  @ApiProperty({ example: safeUserExample.photoUrl })
  photoUrl: string;

  @ApiProperty({ example: safeUserExample.tenantId })
  tenantId: string;

  @ApiProperty({ example: safeUserExample.tenantName })
  tenantName: string;

  @ApiProperty({ example: safeUserExample.tenantPhotoUrl })
  tenantPhotoUrl: string;

  @ApiProperty({ example: safeUserExample.tenantSlug })
  tenantSlug: string;

  @ApiProperty({ example: safeUserExample.enabledActions, isArray: true, type: String })
  enabledActions: string[];
}
