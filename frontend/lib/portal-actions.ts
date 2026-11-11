import type { SafeUser } from '@/lib/api/client';

export const MAPPED_PORTAL_ACTIONS = [
  { api: 'painel', label: 'Painel' },
  { api: 'viewReports', label: 'Relatórios' },
  { api: 'createUser', label: 'Cadastrar usuário' },
  { api: 'editUser', label: 'Editar usuário' },
  { api: 'viewProjects', label: 'Projetos' },
  { api: 'manageProjects', label: 'Gerenciar projetos' },
  { api: 'moveCards', label: 'Mover cards' },
  { api: 'createLane', label: 'Criar raia' },
  { api: 'renameLane', label: 'Alterar nome da raia' },
  { api: 'deleteLane', label: 'Excluir raia' },
  { api: 'createTenant', label: 'Tenant' },
  { api: 'vetorAgent', label: 'Vetor Agent' },
] as const;

export type MappedPortalAction = (typeof MAPPED_PORTAL_ACTIONS)[number]['api'];

export function isWorkspaceManagerProfile(profile: string): boolean {
  return profile === 'Administrador' || profile === 'AdministradorTenant';
}

const TENANT_BASELINE_ACTIONS = [
  'painel',
  'viewReports',
  'createUser',
  'editUser',
  'viewProjects',
  'manageProjects',
  'moveCards',
] as const;

export function effectivePortalActions(user: {
  enabledActions: string[];
  profile: string;
}): string[] {
  if (user.profile === 'Administrador') {
    return MAPPED_PORTAL_ACTIONS.map((action) => action.api);
  }

  const stored = user.enabledActions ?? [];

  if (user.profile !== 'AdministradorTenant') {
    return stored;
  }

  const hasBaseline = TENANT_BASELINE_ACTIONS.some((action) => stored.includes(action));

  if (!hasBaseline) {
    return [...new Set([...TENANT_BASELINE_ACTIONS, ...stored])];
  }

  return stored;
}

export function canViewPainel(user: { enabledActions: string[]; profile: string }): boolean {
  return effectivePortalActions(user).includes('painel');
}

export function canViewReports(user: { enabledActions: string[]; profile: string }): boolean {
  return effectivePortalActions(user).includes('viewReports');
}

export function canCreateUser(user: SafeUser): boolean {
  return effectivePortalActions(user).includes('createUser');
}

export function canConfigureProfile(user: SafeUser): boolean {
  return isWorkspaceManagerProfile(user.profile);
}

export function canViewProjects(user: SafeUser): boolean {
  return effectivePortalActions(user).includes('viewProjects');
}

export function canManageProjectWorkspaces(user: SafeUser): boolean {
  return isWorkspaceManagerProfile(user.profile);
}

export function canMoveCards(user: SafeUser): boolean {
  return effectivePortalActions(user).includes('moveCards');
}

export function canSetBoardBackground(user: SafeUser): boolean {
  return user.profile === 'AdministradorTenant';
}

export function canCreateTenant(user: SafeUser): boolean {
  return user.profile === 'Administrador';
}

export function canUseVetorAgent(user: { enabledActions: string[]; profile: string }): boolean {
  return effectivePortalActions(user).includes('vetorAgent');
}

const LANE_CONFIG_ACTIONS = ['createLane', 'renameLane', 'deleteLane'] as const;

export type LaneConfigAction = (typeof LANE_CONFIG_ACTIONS)[number];

export function isLaneConfigAction(action: string): action is LaneConfigAction {
  return (LANE_CONFIG_ACTIONS as readonly string[]).includes(action);
}

export function canConfigureLane(user: SafeUser, action: LaneConfigAction): boolean {
  return effectivePortalActions(user).includes(action);
}

export function hasProjectsAccess(user: { enabledActions: string[]; profile: string }): boolean {
  return effectivePortalActions(user).includes('viewProjects');
}
