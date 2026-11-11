import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PortalConfigureProfileForm } from './portal-configure-profile-form';

const actor: api.SafeUser = {
  age: 40,
  email: 'admin@vetor.tech',
  enabledActions: [],
  firstName: 'Admin',
  id: 'admin-id',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Administrador',
  sex: 'M',
  tenantId: 'vetor-tenant-id',
  tenantName: 'VETOR',
  tenantSlug: 'vetor',
};

describe('PortalConfigureProfileForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('filters users by tenant and keeps the form after a successful self-save', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-tenant-id', name: 'VETOR', slug: 'vetor' },
      { id: 'acme-id', name: 'Acme', slug: 'acme' },
    ]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: actor.email,
        enabledActions: [],
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: 'Administrador',
        status: 'active',
        tenantId: actor.tenantId,
        tenantName: actor.tenantName,
        tenantSlug: actor.tenantSlug,
      },
      {
        email: 'ana@example.com',
        enabledActions: [],
        firstName: 'Ana',
        id: 'user-ana',
        lastName: 'Silva',
        profile: 'Usuario',
        status: 'active',
        tenantId: 'acme-id',
        tenantName: 'Acme',
        tenantSlug: 'acme',
      },
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      ...actor,
      enabledActions: ['painel'],
      status: 'active',
    });
    const update = vi.spyOn(api, 'updateUserEnabledActions').mockResolvedValue(undefined);
    const refresh = vi.spyOn(api, 'refreshSession').mockResolvedValue({
      ...actor,
      enabledActions: ['painel', 'editUser'],
    });
    const onSaved = vi.fn();
    const onSessionUpdated = vi.fn();
    render(
      <PortalConfigureProfileForm
        actor={actor}
        onSaved={onSaved}
        onSessionUpdated={onSessionUpdated}
      />,
    );

    fireEvent.change(await screen.findByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'acme-id' },
    });
    expect(screen.queryByRole('option', { name: /Admin Vetor/ })).not.toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Ana Silva/ })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'vetor-tenant-id' },
    });
    fireEvent.change(screen.getByLabelText('Usuário'), {
      target: { value: 'admin-id' },
    });

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Painel' })).toBeChecked();
    });
    expect(screen.getByRole('combobox', { name: 'Perfil' })).toHaveValue('Administrador');
    expect(screen.getByRole('combobox', { name: 'Perfil' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Tenant' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Tenant' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Configuração realizada com sucesso',
    );
    expect(update).toHaveBeenCalledWith(
      'admin-id',
      [
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
      ],
      'Administrador',
    );
    expect(refresh).toHaveBeenCalled();
    expect(onSessionUpdated).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
    expect(screen.getByText('Ações habilitadas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('does not refresh the session when another user is saved', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([{ id: 'acme-id', name: 'Acme', slug: 'acme' }]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: 'ana@example.com',
        enabledActions: [],
        firstName: 'Ana',
        id: 'user-ana',
        lastName: 'Silva',
        profile: 'Usuario',
        status: 'active',
        tenantId: 'acme-id',
        tenantName: 'Acme',
        tenantSlug: 'acme',
      },
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      ...actor,
      email: 'ana@example.com',
      enabledActions: [],
      firstName: 'Ana',
      id: 'user-ana',
      lastName: 'Silva',
      profile: 'Usuario',
      status: 'active',
      tenantId: 'acme-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    vi.spyOn(api, 'updateUserEnabledActions').mockResolvedValue(undefined);
    const refresh = vi.spyOn(api, 'refreshSession');
    const onSessionUpdated = vi.fn();
    render(<PortalConfigureProfileForm actor={actor} onSessionUpdated={onSessionUpdated} />);

    fireEvent.change(await screen.findByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'acme-id' },
    });
    fireEvent.change(screen.getByLabelText('Usuário'), {
      target: { value: 'user-ana' },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Configuração realizada com sucesso',
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionUpdated).not.toHaveBeenCalled();
  });

  it('lists project actions and hides tenant switching for AdministradorTenant', async () => {
    const tenantAdmin = {
      ...actor,
      email: 'lead@example.com',
      id: 'tenant-admin',
      profile: 'AdministradorTenant' as const,
      tenantId: 'acme-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    };
    vi.spyOn(api, 'listTenants').mockResolvedValue([{ id: 'acme-id', name: 'Acme', slug: 'acme' }]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: tenantAdmin.email,
        enabledActions: [],
        firstName: tenantAdmin.firstName,
        id: tenantAdmin.id,
        lastName: tenantAdmin.lastName,
        profile: 'AdministradorTenant',
        status: 'active',
        tenantId: tenantAdmin.tenantId,
        tenantName: tenantAdmin.tenantName,
        tenantSlug: tenantAdmin.tenantSlug,
      },
    ]);
    render(<PortalConfigureProfileForm actor={tenantAdmin} onSessionUpdated={vi.fn()} />);

    expect(await screen.findByLabelText('Usuário')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Tenant' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Projetos' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Gerenciar projetos' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Mover cards' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Tenant' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Perfil' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Administrador Tenant' }),
    ).not.toBeInTheDocument();
  });

  it('grants every tenant permission only inside the selected user tenant', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([{ id: 'acme-id', name: 'Acme', slug: 'acme' }]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: 'ana@example.com',
        enabledActions: [],
        firstName: 'Ana',
        id: 'user-ana',
        lastName: 'Silva',
        profile: 'Usuario',
        status: 'active',
        tenantId: 'acme-id',
        tenantName: 'Acme',
        tenantSlug: 'acme',
      },
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      ...actor,
      email: 'ana@example.com',
      enabledActions: [],
      firstName: 'Ana',
      id: 'user-ana',
      lastName: 'Silva',
      profile: 'Usuario',
      status: 'active',
      tenantId: 'acme-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    const update = vi.spyOn(api, 'updateUserEnabledActions').mockResolvedValue(undefined);
    render(<PortalConfigureProfileForm actor={actor} onSessionUpdated={vi.fn()} />);

    fireEvent.change(await screen.findByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'acme-id' },
    });
    fireEvent.change(screen.getByLabelText('Usuário'), {
      target: { value: 'user-ana' },
    });
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Perfil' })).toBeEnabled();
    });
    expect(screen.getByRole('option', { name: 'Administrador Global' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Administrador Tenant' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Perfil' }), {
      target: { value: 'AdministradorTenant' },
    });

    expect(screen.getByText(/limitado ao tenant do usuário/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Painel' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Painel' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Relatórios' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Relatórios' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Gerenciar projetos' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Vetor Agent' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Vetor Agent' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Criar raia' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Criar raia' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Alterar nome da raia' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Excluir raia' })).toBeEnabled();
    expect(screen.queryByRole('checkbox', { name: 'Tenant' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Criar raia' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Painel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        'user-ana',
        [
          'viewReports',
          'createUser',
          'editUser',
          'viewProjects',
          'manageProjects',
          'moveCards',
          'createLane',
        ],
        'AdministradorTenant',
      );
    });
  });

  it('grants every system permission when Administrador Global is selected', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([{ id: 'acme-id', name: 'Acme', slug: 'acme' }]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: 'ana@example.com',
        enabledActions: [],
        firstName: 'Ana',
        id: 'user-ana',
        lastName: 'Silva',
        profile: 'Usuario',
        status: 'active',
        tenantId: 'acme-id',
        tenantName: 'Acme',
        tenantSlug: 'acme',
      },
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      ...actor,
      email: 'ana@example.com',
      enabledActions: ['painel'],
      firstName: 'Ana',
      id: 'user-ana',
      lastName: 'Silva',
      profile: 'Usuario',
      status: 'active',
      tenantId: 'acme-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    const update = vi.spyOn(api, 'updateUserEnabledActions').mockResolvedValue(undefined);
    render(<PortalConfigureProfileForm actor={actor} onSessionUpdated={vi.fn()} />);

    fireEvent.change(await screen.findByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'acme-id' },
    });
    fireEvent.change(screen.getByLabelText('Usuário'), {
      target: { value: 'user-ana' },
    });
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Painel' })).toBeChecked();
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Perfil' }), {
      target: { value: 'Administrador' },
    });

    expect(screen.getByText('Todas as permissões do sistema.')).toBeInTheDocument();
    for (const name of [
      'Painel',
      'Relatórios',
      'Cadastrar usuário',
      'Editar usuário',
      'Projetos',
      'Gerenciar projetos',
      'Mover cards',
      'Criar raia',
      'Alterar nome da raia',
      'Excluir raia',
      'Tenant',
      'Vetor Agent',
    ]) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked();
      expect(screen.getByRole('checkbox', { name })).toBeDisabled();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        'user-ana',
        [
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
        ],
        'Administrador',
      );
    });
  });
});
