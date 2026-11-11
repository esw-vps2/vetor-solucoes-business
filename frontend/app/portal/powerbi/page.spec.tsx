import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import PortalPowerBiPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/portal/powerbi',
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

describe('PortalPowerBiPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not load catalog data for a non-administrator', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    const catalog = vi.spyOn(api, 'listPowerBiCatalog');
    render(<PortalPowerBiPage />);

    expect(await screen.findByRole('heading', { name: 'Power BI' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Power BI/ })).not.toBeInTheDocument();
    expect(catalog).not.toHaveBeenCalled();
    expect(screen.queryByText('Relatórios Importados')).not.toBeInTheDocument();
  });
});
