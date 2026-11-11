import { describe, expect, it } from 'vitest';
import {
  canConfigureLane,
  canViewPainel,
  canViewReports,
  canConfigureProfile,
  canCreateTenant,
  canCreateUser,
  canUseVetorAgent,
  canManageProjectWorkspaces,
  canMoveCards,
  canSetBoardBackground,
  canViewProjects,
  hasProjectsAccess,
} from './portal-actions';
import type { SafeUser } from '@/lib/api/client';

const usuario: SafeUser = {
  age: 32,
  email: 'ana@example.com',
  enabledActions: [],
  firstName: 'Ana',
  id: 'user-id',
  lastName: 'Silva',
  photoUrl: '/api/v1/users/user-id/photo',
  profile: 'Usuario',
  sex: 'F',
  tenantId: 'tenant-id',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

describe('portal actions', () => {
  it('lets Administrador create without stored createUser', () => {
    expect(
      canCreateUser({
        ...usuario,
        enabledActions: [],
        profile: 'Administrador',
      }),
    ).toBe(true);
  });

  it('lets Usuario create only with createUser', () => {
    expect(canCreateUser(usuario)).toBe(false);
    expect(canCreateUser({ ...usuario, enabledActions: ['createUser'] })).toBe(true);
  });

  it('grants Tenant Admin cadastro, perfil, and projetos by profile', () => {
    const tenantAdmin = { ...usuario, enabledActions: [], profile: 'AdministradorTenant' };

    expect(canCreateUser(tenantAdmin)).toBe(true);
    expect(canConfigureProfile(tenantAdmin)).toBe(true);
    expect(canViewProjects(tenantAdmin)).toBe(true);
    expect(canManageProjectWorkspaces(tenantAdmin)).toBe(true);
    expect(canMoveCards(tenantAdmin)).toBe(true);
    expect(canSetBoardBackground(tenantAdmin)).toBe(true);
    expect(hasProjectsAccess(tenantAdmin)).toBe(true);
    expect(canViewProjects({ ...tenantAdmin, enabledActions: ['createUser'] })).toBe(false);
    expect(canConfigureLane(tenantAdmin, 'createLane')).toBe(false);
    expect(canConfigureLane(tenantAdmin, 'renameLane')).toBe(false);
    expect(canConfigureLane(tenantAdmin, 'deleteLane')).toBe(false);
    expect(canConfigureLane({ ...usuario, enabledActions: ['createLane'] }, 'createLane')).toBe(
      true,
    );
    expect(canConfigureLane({ ...usuario, profile: 'Administrador' }, 'deleteLane')).toBe(true);
    expect(
      canSetBoardBackground({
        ...usuario,
        enabledActions: [],
        profile: 'Administrador',
      }),
    ).toBe(false);
    expect(canSetBoardBackground({ ...usuario, enabledActions: ['viewProjects'] })).toBe(false);
  });

  it('hides Projetos from Usuario without viewProjects', () => {
    expect(canViewPainel(usuario)).toBe(false);
    expect(canViewReports(usuario)).toBe(false);
    expect(canViewProjects(usuario)).toBe(false);
    expect(canViewPainel({ ...usuario, enabledActions: ['painel'] })).toBe(true);
    expect(canViewReports({ ...usuario, enabledActions: ['viewReports'] })).toBe(true);
    expect(canViewProjects({ ...usuario, enabledActions: ['viewProjects'] })).toBe(true);
    expect(canMoveCards({ ...usuario, enabledActions: ['viewProjects'] })).toBe(false);
    expect(canManageProjectWorkspaces({ ...usuario, enabledActions: ['manageProjects'] })).toBe(
      false,
    );
  });

  it('shows Vetor Agent only when the effective action includes vetorAgent', () => {
    expect(canUseVetorAgent(usuario)).toBe(false);
    expect(canUseVetorAgent({ ...usuario, enabledActions: ['vetorAgent'] })).toBe(true);
    expect(canUseVetorAgent({ ...usuario, enabledActions: [], profile: 'Administrador' })).toBe(
      true,
    );
    expect(
      canUseVetorAgent({ ...usuario, enabledActions: [], profile: 'AdministradorTenant' }),
    ).toBe(false);
    expect(
      canUseVetorAgent({
        ...usuario,
        enabledActions: ['painel'],
        profile: 'AdministradorTenant',
      }),
    ).toBe(false);
    expect(
      canUseVetorAgent({
        ...usuario,
        enabledActions: ['vetorAgent'],
        profile: 'AdministradorTenant',
      }),
    ).toBe(true);
  });

  it('shows Cadastrar tenant only to Administrador', () => {
    expect(
      canCreateTenant({
        ...usuario,
        enabledActions: [],
        profile: 'Administrador',
      }),
    ).toBe(true);
    expect(canCreateTenant({ ...usuario, enabledActions: ['createTenant'] })).toBe(false);
    expect(
      canCreateTenant({
        ...usuario,
        enabledActions: ['createTenant'],
        profile: 'AdministradorTenant',
      }),
    ).toBe(false);
  });
});
