import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PASSWORD_HTML_PATTERN, PASSWORD_REQUIREMENT_LABEL } from '@/lib/password-policy';
import { PortalRegisterForm } from './portal-register-form';

describe('PortalRegisterForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('requires at least 6 characters with letters, numbers, and a special character', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'Acme', slug: 'acme' },
    ]);
    render(<PortalRegisterForm />);

    const password = await screen.findByLabelText('Senha');
    expect(password).toHaveAttribute('minLength', '6');
    expect(password).toHaveAttribute('pattern', PASSWORD_HTML_PATTERN);
    expect(screen.getByText(PASSWORD_REQUIREMENT_LABEL)).toBeInTheDocument();
  });

  it('creates a user without a photo', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'Acme', slug: 'acme' },
    ]);
    const createUser = vi.spyOn(api, 'createUser').mockResolvedValue(undefined);
    render(<PortalRegisterForm />);

    fireEvent.change(await screen.findByLabelText('Nome'), {
      target: { value: 'Nova' },
    });
    fireEvent.change(screen.getByLabelText('Sobrenome'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText('Cargo'), {
      target: { value: 'Product Manager' },
    });
    fireEvent.change(screen.getByLabelText('idade'), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText('sexo'), { target: { value: 'F' } });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'nova@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'tenant-id' },
    });
    expect(
      screen.queryByRole('checkbox', { name: 'Administrador Tenant' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Ações habilitadas')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Usuário cadastrado.');
    expect(createUser).toHaveBeenCalledWith(
      {
        age: 32,
        email: 'nova@example.com',
        enabledActions: [],
        firstName: 'Nova',
        cargo: 'Product Manager',
        lastName: 'User',
        password: 'ExamplePassword12!',
        sex: 'F',
        tenantId: 'tenant-id',
      },
      undefined,
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Usuário cadastrado.');
  });

  it('lets a global administrator choose the new user profile', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'Acme', slug: 'acme' },
    ]);
    const createUser = vi.spyOn(api, 'createUser').mockResolvedValue(undefined);
    render(
      <PortalRegisterForm
        actor={{
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
          tenantName: 'Acme',
          tenantSlug: 'acme',
        }}
      />,
    );

    expect(
      screen.queryByRole('checkbox', { name: 'Administrador Tenant' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Ações habilitadas')).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Usuário' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Administrador Global' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Administrador Tenant' })).toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Nova' } });
    fireEvent.change(screen.getByLabelText('Sobrenome'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('idade'), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText('sexo'), { target: { value: 'F' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'nova@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'ExamplePassword12!' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'tenant-id' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Perfil' }), {
      target: { value: 'AdministradorTenant' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ enabledActions: [], profile: 'AdministradorTenant' }),
      undefined,
    );
  });

  it('submits a selected PNG photo', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'Acme', slug: 'acme' },
    ]);
    const createUser = vi.spyOn(api, 'createUser').mockResolvedValue(undefined);
    render(<PortalRegisterForm />);
    const photo = screen.getByLabelText('Foto');

    expect(photo).toHaveAttribute('accept', 'image/*');
    fireEvent.change(await screen.findByLabelText('Nome'), {
      target: { value: 'Nova' },
    });
    fireEvent.change(screen.getByLabelText('Sobrenome'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText('idade'), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText('sexo'), { target: { value: 'F' } });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'nova@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'tenant-id' },
    });
    const png = new File(['png'], 'face.png', { type: 'image/png' });
    fireEvent.change(photo, { target: { files: [png] } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(createUser).toHaveBeenCalledWith(expect.any(Object), png);
    expect(await screen.findByRole('status')).toHaveTextContent('Usuário cadastrado.');
  });

  it('rejects a selected non-image photo before submit', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'tenant-id', name: 'Acme', slug: 'acme' },
    ]);
    const createUser = vi.spyOn(api, 'createUser').mockResolvedValue(undefined);
    render(<PortalRegisterForm />);

    fireEvent.change(await screen.findByLabelText('Nome'), {
      target: { value: 'Nova' },
    });
    fireEvent.change(screen.getByLabelText('Sobrenome'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText('idade'), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText('sexo'), { target: { value: 'F' } });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'nova@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'ExamplePassword12!' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'tenant-id' },
    });
    const notes = new File(['notes'], 'face.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Foto'), {
      target: { files: [notes] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(createUser).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'A foto deve ser uma imagem e ter no máximo 5 MB.',
    );
  });
});
