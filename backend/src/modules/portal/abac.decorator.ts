import { SetMetadata } from '@nestjs/common';

export const ABAC_ACTION = 'abac_action';

export type AbacAction = 'read' | 'write' | 'delete';

export const RequireAction = (action: AbacAction) =>
  SetMetadata(ABAC_ACTION, action);
