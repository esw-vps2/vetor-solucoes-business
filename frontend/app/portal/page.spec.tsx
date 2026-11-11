import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PORTAL_CADASTRO_INTENT_KEY } from '@/lib/portal-cadastro';
import PortalPage from './page';

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
  id: 'admin-id',
  lastName: 'Vetor',
  photoUrl: '/brand/symbol-vetor.png',
  profile: 'Administrador',
  tenantId: 'vetor-tenant-id',
  tenantName: 'VETOR',
  tenantSlug: 'vetor',
};

describe('PortalPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    sessionStorage.removeItem(PORTAL_CADASTRO_INTENT_KEY);
  });

  it('renders the authenticated dashboard shell with Painel and tenant identity', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      enabledActions: ['painel', 'viewReports'],
    });
    render(<PortalPage />);

    expect(await screen.findByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo ao Portal Vector.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Painel/ })).toHaveAttribute('href', '/portal');
    expect(screen.getByRole('link', { name: /Painel/ }).querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.queryByText('acme')).not.toBeInTheDocument();
    expect(screen.getAllByText('Ana Silva')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Ana Silva' })).toHaveAttribute(
      'src',
      expect.stringContaining('/api/v1/users/user-id/photo'),
    );
    expect(screen.getByRole('img', { name: 'VETOR' }).getAttribute('src')).toContain(
      'symbol-vetor.png',
    );
    expect(screen.getByText('BUSINESS & TECHNOLOGY')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modo escuro' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' }).className).toContain('size-10');
    expect(document.querySelector('main')?.className).toContain('overflow-x-hidden');
    expect(screen.getByRole('button', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastro' }).className).toContain('cursor-pointer');
    expect(screen.getByRole('link', { name: /Relatórios/ })).toHaveAttribute(
      'href',
      '/portal/relatorios',
    );
    expect(screen.queryByRole('link', { name: /Projetos/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Financeiro/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Power BI/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administrador' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar usuário' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar usuário' })).not.toBeInTheDocument();
    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuario')).not.toBeInTheDocument();
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar Usuário' })).not.toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
    expect(screen.queryByText('Inbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Widget')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'WhatsApp. Estou pronto para lhe atender.' }),
    ).not.toBeInTheDocument();
  });

  it('opens Cadastro with only the edit action for a non-administrator', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    render(<PortalPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cadastro' }));

    expect(screen.getByRole('heading', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar usuário' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar usuário' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Configurar Perfil' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar tenant' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Alterar foto da tenant' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Bem-vindo ao Portal Vector.')).not.toBeInTheDocument();
    expect(screen.getAllByText('Ana Silva')).toHaveLength(1);
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('opens Cadastro when returning from another portal page', async () => {
    sessionStorage.setItem(PORTAL_CADASTRO_INTENT_KEY, '1');
    vi.spyOn(api, 'getSession').mockResolvedValue(usuario);
    render(<PortalPage />);

    expect(await screen.findByRole('heading', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastro' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByText('Bem-vindo ao Portal Vector.')).not.toBeInTheDocument();
  });

  it('shows Cadastro create, edit, perfil, and tenant actions for Administrador', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(administrador);
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-tenant-id', name: 'VETOR', slug: 'vetor' },
      { id: 'acme-id', name: 'Acme', slug: 'acme' },
    ]);
    render(<PortalPage />);

    expect(await screen.findByRole('button', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Projetos/ })).toHaveAttribute(
      'href',
      '/portal/projetos',
    );
    expect(screen.getByRole('link', { name: /Projetos/ }).querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Financeiro' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Financeiro' }).querySelector('svg')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
    expect(screen.getByRole('link', { name: 'Contratos' })).toHaveAttribute(
      'href',
      '/portal/financeiro',
    );
    expect(screen.getByRole('link', { name: /Power BI/ })).toHaveAttribute(
      'href',
      '/portal/powerbi',
    );
    expect(screen.getByRole('link', { name: 'Administrador' })).toHaveAttribute(
      'href',
      '/portal/administrador',
    );
    expect(screen.getAllByText('Admin Vetor')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Admin Vetor' })).toHaveAttribute(
      'src',
      '/brand/symbol-vetor.png',
    );
    expect(screen.queryByText('admin@vetor.tech')).not.toBeInTheDocument();
    expect(screen.getByText('VETOR')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.queryByText('vetor')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));

    expect(screen.getByRole('heading', { name: 'Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar usuário' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar usuário' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Configurar Perfil' }).querySelector('svg'),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Cadastrar tenant' }).querySelector('svg'),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Alterar foto da tenant' }).querySelector('svg'),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar usuário' }));

    expect(await screen.findByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Sobrenome')).toBeInTheDocument();
    expect(screen.getByLabelText('idade')).toBeInTheDocument();
    expect(screen.getByLabelText('sexo')).toBeInTheDocument();
    expect(screen.getByLabelText('Foto')).toBeInTheDocument();
    expect(screen.queryByLabelText('URL da imagem')).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Tenant' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Acme (acme)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'VETOR (vetor)' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Perfil' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Usuário' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Administrador Global' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Administrador Tenant' })).toBeInTheDocument();
    expect(screen.queryByText('Ações habilitadas')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Administrador Tenant' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument();
  });

  it('shows Cadastrar usuário for a Usuario with createUser and hides Configurar Perfil', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      enabledActions: ['createUser'],
    });
    render(<PortalPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cadastro' }));

    expect(screen.getByRole('button', { name: 'Cadastrar usuário' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar usuário' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Configurar Perfil' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar tenant' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Alterar foto da tenant' }),
    ).not.toBeInTheDocument();
  });

  it('shows Projetos and tenant-scoped cadastro for AdministradorTenant without Power BI', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      profile: 'AdministradorTenant',
    });
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: usuario.tenantId, name: usuario.tenantName, slug: usuario.tenantSlug },
    ]);
    render(<PortalPage />);

    expect(await screen.findByRole('link', { name: /Projetos/ })).toHaveAttribute(
      'href',
      '/portal/projetos',
    );
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contratos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Financeiro/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Power BI/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administrador' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cadastro' }));
    expect(screen.getByRole('button', { name: 'Cadastrar usuário' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configurar Perfil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar tenant' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Alterar foto da tenant' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar usuário' }));
    expect(await screen.findByRole('combobox', { name: 'Tenant' })).toBeDisabled();
    expect(screen.queryByRole('combobox', { name: 'Perfil' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Administrador Tenant' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Tenant' })).not.toBeInTheDocument();
  });

  it('opens the Perfil modal from Configurar Perfil and closes it after a successful save', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(administrador);
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-tenant-id', name: 'VETOR', slug: 'vetor' },
    ]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: administrador.email,
        enabledActions: [],
        firstName: administrador.firstName,
        id: administrador.id,
        lastName: administrador.lastName,
        profile: 'Administrador',
        status: 'active',
        tenantId: administrador.tenantId,
        tenantName: administrador.tenantName,
        tenantSlug: administrador.tenantSlug,
      },
    ]);
    vi.spyOn(api, 'getUser').mockResolvedValue({
      ...administrador,
      enabledActions: ['painel'],
      status: 'active',
    });
    vi.spyOn(api, 'updateUserEnabledActions').mockResolvedValue(undefined);
    vi.spyOn(api, 'refreshSession').mockResolvedValue({
      ...administrador,
      enabledActions: ['painel'],
    });
    render(<PortalPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cadastro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Configurar Perfil' }));

    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeInTheDocument();
    fireEvent.change(await screen.findByRole('combobox', { name: 'Tenant' }), {
      target: { value: 'vetor-tenant-id' },
    });
    fireEvent.change(screen.getByLabelText('Usuário'), {
      target: { value: 'admin-id' },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Perfil' })).not.toBeInTheDocument();
    });
    expect(api.updateUserEnabledActions).toHaveBeenCalled();
  });

  it('hides Cadastrar tenant from AdministradorTenant even with createTenant granted', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      enabledActions: ['createTenant'],
      profile: 'AdministradorTenant',
    });
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: usuario.tenantId, name: usuario.tenantName, slug: usuario.tenantSlug },
    ]);
    render(<PortalPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cadastro' }));

    expect(screen.getByRole('button', { name: 'Cadastrar usuário' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar tenant' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Alterar foto da tenant' }),
    ).not.toBeInTheDocument();
  });

  it('hides Cadastrar tenant from Usuario even with createTenant granted', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue({
      ...usuario,
      enabledActions: ['createTenant'],
    });
    render(<PortalPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cadastro' }));

    expect(screen.queryByRole('button', { name: 'Cadastrar tenant' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Alterar foto da tenant' }),
    ).not.toBeInTheDocument();
  });

  it('opens Cadastrar tenant and closes the modal after success', async () => {
    vi.spyOn(api, 'getSession').mockResolvedValue(administrador);
    vi.spyOn(api, 'createTenant').mockResolvedValue({
      email: null,
      id: 'new-tenant',
      name: 'Northwind',
      slug: 'northwind',
    });
    render(<PortalPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cadastro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar tenant' }));

    expect(screen.getByRole('heading', { name: 'Cadastrar tenant' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome Empresa')).toBeInTheDocument();
    expect(screen.getByLabelText('Slug')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).not.toBeRequired();

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Northwind' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Cadastrar tenant' })).not.toBeInTheDocument();
    });
    expect(api.createTenant).toHaveBeenCalledWith(
      {
        name: 'Northwind',
        slug: 'northwind',
      },
      undefined,
    );
  });
});
