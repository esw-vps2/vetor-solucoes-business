import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PortalEditUserForm } from './portal-edit-user-form';

const actor: api.SafeUser = {
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

const users: api.UserListItem[] = [
  {
    email: 'ana@example.com',
    enabledActions: [],
    firstName: 'Ana',
    id: 'user-ana',
    lastName: 'Silva',
    profile: 'Usuario',
    status: 'active',
    tenantId: 'tenant-id',
    tenantName: 'Acme',
    tenantSlug: 'acme',
  },
  {
    email: 'bruno@example.com',
    enabledActions: [],
    firstName: 'Bruno',
    id: 'user-bruno',
    lastName: 'Costa',
    profile: 'Usuario',
    status: 'active',
    tenantId: 'tenant-id',
    tenantName: 'Acme',
    tenantSlug: 'acme',
  },
];

describe('PortalEditUserForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('filters the administrator picker by email after three characters', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([]);
    vi.spyOn(api, 'listUsers').mockResolvedValue(users);
    render(<PortalEditUserForm actor={actor} onSaved={vi.fn()} />);

    expect(await screen.findByText(/ana@example.com/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
    expect(screen.getByText(/bruno@example.com/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar e-mail'), {
      target: { value: 'an' },
    });
    expect(screen.getByText(/bruno@example.com/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar e-mail'), {
      target: { value: 'ana' },
    });
    expect(screen.getByText(/ana@example.com/)).toBeInTheDocument();
    expect(screen.queryByText(/bruno@example.com/)).not.toBeInTheDocument();
  });

  it('hides the picker for a non-administrator editing themselves', () => {
    render(
      <PortalEditUserForm
        actor={{ ...actor, profile: 'Usuario', email: 'ana@example.com' }}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Buscar e-mail')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resetar Login' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveValue('Admin');
    expect(screen.getByLabelText('Foto')).toHaveAttribute('accept', 'image/*');
    expect(screen.queryByRole('button', { name: 'Reativar' })).not.toBeInTheDocument();
  });

  it('shows Reativar only while the loaded user is blocked', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([{ ...users[0], status: 'blocked' }]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      age: 32,
      email: 'ana@example.com',
      enabledActions: [],
      firstName: 'Ana',
      id: 'user-ana',
      lastName: 'Silva',
      photoUrl: '/brand/symbol-vetor.png',
      profile: 'Usuario',
      sex: 'F',
      status: 'blocked',
      tenantId: 'tenant-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    const reactivate = vi.spyOn(api, 'reactivateUser').mockResolvedValue(undefined);
    render(<PortalEditUserForm actor={actor} onSaved={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /ana@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(await screen.findByRole('button', { name: 'Reativar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reativar' }));

    await waitFor(() => {
      expect(reactivate).toHaveBeenCalledWith('user-ana');
    });
    expect(screen.queryByRole('button', { name: 'Reativar' })).not.toBeInTheDocument();
  });

  it('submits reactivation once when Reativar is clicked twice', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([{ ...users[0], status: 'blocked' }]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      age: 32,
      email: 'ana@example.com',
      enabledActions: [],
      firstName: 'Ana',
      id: 'user-ana',
      lastName: 'Silva',
      photoUrl: '/brand/symbol-vetor.png',
      profile: 'Usuario',
      sex: 'F',
      status: 'blocked',
      tenantId: 'tenant-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    let finish = () => {};
    const reactivate = vi.spyOn(api, 'reactivateUser').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(undefined);
        }),
    );
    render(<PortalEditUserForm actor={actor} onSaved={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /ana@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const button = await screen.findByRole('button', { name: 'Reativar' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(reactivate).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Reativar' })).not.toBeInTheDocument();
    });
  });

  it('lets a global administrator choose the loaded user tenant and submit it', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'VETOR', slug: 'vetor' },
      { id: 'other-tenant', name: 'Acme', slug: 'acme' },
    ]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      { ...users[0], tenantId: 'other-tenant', tenantName: 'Acme', tenantSlug: 'acme' },
    ]);
    vi.spyOn(api, 'getUser').mockImplementation(async (id: string) => {
      if (id === 'user-ana') {
        return {
          age: 32,
          email: 'ana@example.com',
          enabledActions: [],
          firstName: 'Ana',
          id: 'user-ana',
          lastName: 'Silva',
          photoUrl: '',
          profile: 'Usuario',
          sex: 'F',
          status: 'active',
          tenantId: 'other-tenant',
          tenantName: 'Acme',
          tenantSlug: 'acme',
        };
      }

      return { ...actor, status: 'active' };
    });
    const updateUser = vi.spyOn(api, 'updateUser').mockResolvedValue(undefined);
    render(<PortalEditUserForm actor={actor} onSaved={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /ana@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Tenant')).toHaveValue('other-tenant');
    });

    fireEvent.change(screen.getByLabelText('Tenant'), {
      target: { value: 'tenant-id' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith(
        'user-ana',
        expect.objectContaining({
          email: 'ana@example.com',
          firstName: 'Ana',
          tenantId: 'tenant-id',
        }),
        undefined,
      );
    });
  });

  it('does not send tenantId when the selected tenant is already the user home tenant', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'home-tenant', name: 'VETOR', slug: 'vetor' },
      { id: 'session-tenant', name: 'Acme', slug: 'acme' },
    ]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: actor.email,
        enabledActions: [],
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: actor.profile,
        status: 'active',
        tenantId: 'home-tenant',
        tenantName: 'VETOR',
        tenantSlug: 'vetor',
      },
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      ...actor,
      status: 'active',
      tenantId: 'home-tenant',
      tenantName: 'VETOR',
      tenantSlug: 'vetor',
    });
    const updateUser = vi.spyOn(api, 'updateUser').mockResolvedValue(undefined);
    render(
      <PortalEditUserForm
        actor={{ ...actor, tenantId: 'session-tenant', tenantName: 'Acme', tenantSlug: 'acme' }}
        onSaved={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /admin@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Tenant')).toHaveValue('home-tenant');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith(
        actor.id,
        expect.not.objectContaining({ tenantId: expect.anything() }),
        undefined,
      );
    });
  });

  it('hides Tenant from a tenant administrator and a Usuario and omits it on save', async () => {
    const listTenants = vi.spyOn(api, 'listTenants');
    const updateUser = vi.spyOn(api, 'updateUser').mockResolvedValue(undefined);
    const tenantAdmin = {
      ...actor,
      profile: 'AdministradorTenant',
      email: 'tenant-admin@example.com',
    };
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: tenantAdmin.email,
        enabledActions: [],
        firstName: tenantAdmin.firstName,
        id: tenantAdmin.id,
        lastName: tenantAdmin.lastName,
        profile: tenantAdmin.profile,
        status: 'active',
        tenantId: tenantAdmin.tenantId,
        tenantName: tenantAdmin.tenantName,
        tenantSlug: tenantAdmin.tenantSlug,
      },
      ...users,
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      ...tenantAdmin,
      age: tenantAdmin.age,
      cargo: '',
      enabledActions: [],
      sex: 'M',
      status: 'active',
    });

    const { unmount } = render(<PortalEditUserForm actor={tenantAdmin} onSaved={vi.fn()} />);

    expect(screen.queryByLabelText('Tenant')).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /tenant-admin@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith(
        tenantAdmin.id,
        expect.not.objectContaining({ tenantId: expect.anything() }),
        undefined,
      );
    });
    expect(listTenants).not.toHaveBeenCalled();

    unmount();
    updateUser.mockClear();
    const usuario = { ...actor, profile: 'Usuario', email: 'ana@example.com' };
    render(<PortalEditUserForm actor={usuario} onSaved={vi.fn()} />);

    expect(screen.queryByLabelText('Tenant')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith(
        usuario.id,
        expect.not.objectContaining({ tenantId: expect.anything() }),
        undefined,
      );
    });
    expect(listTenants).not.toHaveBeenCalled();
  });

  it('lets Administrador Global delete a selected user after confirmation', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([]);
    vi.spyOn(api, 'listUsers').mockResolvedValue(users);
    const removeUser = vi.spyOn(api, 'deleteUser').mockResolvedValue(undefined);
    render(<PortalEditUserForm actor={actor} onSaved={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /ana@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(screen.getByText('Excluir este usuário?')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' }).at(-1)!);

    await waitFor(() => {
      expect(removeUser).toHaveBeenCalledWith('user-ana');
    });
    expect(screen.queryByText(/ana@example.com/)).not.toBeInTheDocument();
    expect(screen.getByText('Usuário excluído.')).toBeInTheDocument();
  });

  it('hides Excluir from AdministradorTenant', async () => {
    vi.spyOn(api, 'listUsers').mockResolvedValue(users);
    render(
      <PortalEditUserForm
        actor={{ ...actor, profile: 'AdministradorTenant', email: 'tenant@example.com' }}
        onSaved={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /ana@example.com/ }));
    const edit = screen.getByRole('button', { name: 'Editar' });
    const reset = screen.getByRole('button', { name: 'Resetar Login' });
    expect(edit).toBeInTheDocument();
    expect(reset.className).toContain('bg-accent');
    expect(reset.className).toContain('text-navy');
    expect(reset.className).toBe(edit.className);
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });

  it('sends Resetar Login for an active user and hides it after Editar opens', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      ...users,
      {
        ...users[0],
        email: actor.email,
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: 'Administrador',
      },
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      age: 32,
      email: 'ana@example.com',
      enabledActions: [],
      firstName: 'Ana',
      id: 'user-ana',
      lastName: 'Silva',
      photoUrl: '/brand/symbol-vetor.png',
      profile: 'Usuario',
      sex: 'F',
      status: 'active',
      tenantId: 'tenant-id',
      tenantName: 'Acme',
      tenantSlug: 'acme',
    });
    const send = vi.spyOn(api, 'sendPasswordResetLink').mockResolvedValue(undefined);
    render(<PortalEditUserForm actor={actor} onSaved={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /ana@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Resetar Login' }));

    await waitFor(() => {
      expect(send).toHaveBeenCalledWith('user-ana');
    });
    expect(screen.getByText('Link de redefinição enviado.')).toBeInTheDocument();
    expect(screen.queryByText(/change-password/)).not.toBeInTheDocument();
    expect(screen.queryByText(/token=/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(actor.email) }));
    expect(screen.getByRole('button', { name: 'Resetar Login' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ana@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Resetar Login' })).not.toBeInTheDocument();
  });

  it('hides Resetar Login for a blocked user and shows the failure sentence', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([{ ...users[0], status: 'blocked' }, users[1]]);
    const send = vi.spyOn(api, 'sendPasswordResetLink').mockRejectedValue(new Error('smtp'));
    render(<PortalEditUserForm actor={actor} onSaved={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /ana@example.com/ }));
    expect(screen.queryByRole('button', { name: 'Resetar Login' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /bruno@example.com/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Resetar Login' }));

    await waitFor(() => {
      expect(send).toHaveBeenCalledWith('user-bruno');
    });
    expect(screen.getByText('Não foi possível enviar o link de redefinição.')).toBeInTheDocument();
    expect(screen.queryByText(/change-password/)).not.toBeInTheDocument();
  });
});
