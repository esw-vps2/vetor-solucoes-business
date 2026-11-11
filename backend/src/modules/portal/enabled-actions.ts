import { BadRequestException } from '@nestjs/common';

export const MAPPED_ACTIONS = [
  'painel',
  'viewReports',
  'createUser',
  'editUser',
  'viewProjects',
  'manageProjects',
  'moveCards',
  'createLane',
  'renameLane',
  'deleteLane',
  'createTenant',
  'vetorAgent',
] as const;

export type MappedAction = (typeof MAPPED_ACTIONS)[number];

export const LANE_CONFIG_ACTIONS = [
  'createLane',
  'renameLane',
  'deleteLane',
] as const;

export function isLaneConfigAction(action: string): boolean {
  return (LANE_CONFIG_ACTIONS as readonly string[]).includes(action);
}

export function enabledActionsForActor(
  actor: { profile: string },
  current: string[],
  incoming: string[],
): string[] {
  if (actor.profile === 'Administrador') {
    return incoming;
  }

  const kept = current.filter((action) => isLaneConfigAction(action));

  return [...incoming.filter((action) => !isLaneConfigAction(action)), ...kept];
}

export const ADMINISTRATOR_TENANT_ACTIONS: readonly MappedAction[] = [
  'painel',
  'viewReports',
  'createUser',
  'editUser',
  'viewProjects',
  'manageProjects',
  'moveCards',
];

export function parseEnabledActions(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  let items: unknown[];

  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
          throw new BadRequestException('Invalid input.');
        }
        items = parsed;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Invalid input.');
      }
    } else {
      items = trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } else {
    throw new BadRequestException('Invalid input.');
  }

  return assertMappedActions(items.map((item) => String(item)));
}

export function assertMappedActions(actions: string[]): string[] {
  const unique = [...new Set(actions)];

  for (const action of unique) {
    if (!MAPPED_ACTIONS.includes(action as MappedAction)) {
      throw new BadRequestException('Invalid input.');
    }
  }

  return unique;
}

export function effectiveMappedActions(user: {
  enabledActions: string[];
  profile: string;
}): string[] {
  if (user.profile === 'Administrador') {
    return [...MAPPED_ACTIONS];
  }

  const stored = user.enabledActions ?? [];

  if (user.profile !== 'AdministradorTenant') {
    return stored;
  }

  const hasBaseline = ADMINISTRATOR_TENANT_ACTIONS.some((action) =>
    stored.includes(action),
  );

  if (!hasBaseline) {
    return [...new Set([...ADMINISTRATOR_TENANT_ACTIONS, ...stored])];
  }

  return stored;
}

export function hasMappedAction(
  user: { enabledActions: string[]; profile: string },
  action: MappedAction,
): boolean {
  return effectiveMappedActions(user).includes(action);
}

export function isWorkspaceManager(profile: string): boolean {
  return profile === 'Administrador' || profile === 'AdministradorTenant';
}

export function hasProjectsAccess(user: {
  enabledActions: string[];
  profile: string;
}): boolean {
  return hasMappedAction(user, 'viewProjects');
}
