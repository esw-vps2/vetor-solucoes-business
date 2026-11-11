import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { userListItemExample } from '../../../common/swagger/examples.js';

export class UserListItemDto {
  @ApiProperty({ example: userListItemExample.id })
  id: string;

  @ApiProperty({ example: userListItemExample.firstName })
  firstName: string;

  @ApiProperty({ example: userListItemExample.lastName })
  lastName: string;

  @ApiPropertyOptional({ example: 'Product Manager' })
  cargo?: string;

  @ApiProperty({ example: userListItemExample.email })
  email: string;

  @ApiProperty({ example: userListItemExample.tenantId })
  tenantId: string;

  @ApiProperty({ example: userListItemExample.tenantName })
  tenantName: string;

  @ApiProperty({ example: userListItemExample.tenantSlug })
  tenantSlug: string;

  @ApiProperty({ example: userListItemExample.profile })
  profile: string;

  @ApiProperty({ example: userListItemExample.status })
  status: string;

  @ApiProperty({
    example: userListItemExample.enabledActions,
    isArray: true,
    type: String,
  })
  enabledActions: string[];
}
