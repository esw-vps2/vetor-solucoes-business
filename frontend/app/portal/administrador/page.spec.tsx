import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import PortalAdministradorPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/portal/administrador',
  useRouter: () => ({ push: vi.fn() }),
}));

const usuario: api.SafeUser = {
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

const administrador: api.SafeUser = {
  ...usuario,
  email: 'admin@vetor.tech',
  firstName: 'Admin',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Administrador',
  tenantId: 'vetor-tenant-id',
  tenantName: 'VETOR',
  tenantSlug: 'vetor',
};

describe('PortalAdministradorPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the Administrador screen and MFA list for Administrador', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(administrador);
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([]);
    vi.spyOn(api, 'getAdminAiPricing').mockResolvedValue({
      aiTokenCostPerMillion: 0.6,
    });
    vi.spyOn(api, 'listTenantMfaSettings').mockResolvedValue([
      {
        aiTokenCostPerMillion: 0.6,
        id: 'vetor-tenant-id',
        mfaEnabled: false,
        name: 'VETOR',
        slug: 'vetor',
      },
    ]);
    render(<PortalAdministradorPage />);

    expect(await screen.findByRole('heading', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Administrador' })).toHaveAttribute(
      'href',
      '/portal/administrador',
    );
    expect(await screen.findByRole('heading', { name: 'MFA' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Habilitar MFA de VETOR' })).toBeInTheDocument();
  });

  it('hides the nav item and does not load settings for Usuario', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    const list = vi.spyOn(api, 'listTenantMfaSettings');
    render(<PortalAdministradorPage />);

    expect(await screen.findByRole('heading', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administrador' })).not.toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
  });

  it('hides the nav item and does not load settings for AdministradorTenant', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      profile: 'AdministradorTenant',
    });
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([]);
    const list = vi.spyOn(api, 'listTenantMfaSettings');
    render(<PortalAdministradorPage />);

    expect(await screen.findByRole('heading', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administrador' })).not.toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
  });
});
