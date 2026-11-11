import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { ProjectsHome } from './projects-home';

const admin: api.SafeUser = {
  age: 40,
  email: 'admin@example.com',
  enabledActions: [],
  firstName: 'Admin',
  id: 'admin-id',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Administrador',
  sex: 'M',
  tenantId: 'tenant-id',
  tenantName: 'VETOR',
  tenantSlug: 'vetor',
};

describe('ProjectsHome', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists workspaces, projects, and navigates by project name', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'VETOR', slug: 'vetor' },
      { id: 'acme-id', name: 'Acme', slug: 'acme' },
    ]);
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Delivery', tenantId: 'tenant-id' },
    ]);
    vi.spyOn(api, 'listWorkspaceProjects').mockResolvedValue([
      { id: 'proj-1', name: 'Portal Kanban', workspaceId: 'ws-1' },
    ]);

    render(<ProjectsHome onUserUpdated={vi.fn()} user={admin} />);

    expect(await screen.findByLabelText('Tenant')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Selecione um tenant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nova workspace' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Portal Kanban' })).toHaveAttribute(
      'href',
      '/portal/projetos/proj-1',
    );
    expect(screen.getByRole('button', { name: 'Novo projeto' })).toBeInTheDocument();
  });

  it('hides manager controls and the tenant picker for Usuario', async () => {
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([]);
    render(
      <ProjectsHome
        onUserUpdated={vi.fn()}
        user={{ ...admin, profile: 'Usuario', enabledActions: ['viewProjects'] }}
      />,
    );

    expect(await screen.findByText('Nenhuma workspace neste tenant.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tenant')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nova workspace' })).not.toBeInTheDocument();
  });

  it('lets AdministradorTenant manage workspaces without a tenant picker', async () => {
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([]);
    render(
      <ProjectsHome
        onUserUpdated={vi.fn()}
        user={{ ...admin, profile: 'AdministradorTenant' }}
      />,
    );

    expect(await screen.findByRole('button', { name: 'Nova workspace' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Tenant')).not.toBeInTheDocument();
    expect(await screen.findByText('Nenhuma workspace neste tenant.')).toBeInTheDocument();
  });

  it('shows empty project copy and workspace delete confirmation', async () => {
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([
      { id: 'ws-1', name: 'Delivery', tenantId: 'tenant-id' },
    ]);
    vi.spyOn(api, 'listWorkspaceProjects').mockResolvedValue([]);
    render(<ProjectsHome onUserUpdated={vi.fn()} user={admin} />);

    expect(await screen.findByText('Nenhum projeto nesta workspace.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(
      screen.getByText('Excluir esta workspace e todos os projetos e cards?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('updates the session tenant from the picker', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'VETOR', slug: 'vetor' },
      { id: 'acme-id', name: 'Acme', slug: 'acme' },
    ]);
    vi.spyOn(api, 'listProjectWorkspaces').mockResolvedValue([]);
    const switchTenant = vi.spyOn(api, 'updateSessionTenant').mockResolvedValue({
      ...admin,
      tenantId: 'acme-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    const onUserUpdated = vi.fn();
    render(<ProjectsHome onUserUpdated={onUserUpdated} user={admin} />);

    fireEvent.change(await screen.findByLabelText('Tenant'), {
      target: { value: 'acme-id' },
    });

    await waitFor(() => {
      expect(switchTenant).toHaveBeenCalledWith('acme-id');
    });
    expect(onUserUpdated).toHaveBeenCalled();
  });
});
