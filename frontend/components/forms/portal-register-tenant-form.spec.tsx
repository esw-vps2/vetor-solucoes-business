import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import * as api from '@/lib/api/client';
import { PortalRegisterTenantForm } from './portal-register-tenant-form';

describe('PortalRegisterTenantForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates a tenant without email and closes on success', async () => {
    const create = vi.spyOn(api, 'createTenant').mockResolvedValue({
      email: null,
      id: 'tenant-id',
      name: 'Northwind',
      slug: 'northwind',
    });
    const onSuccess = vi.fn();
    render(<PortalRegisterTenantForm onSuccess={onSuccess} />);

    expect(screen.getByLabelText('Nome Empresa')).toBeRequired();
    expect(screen.getByLabelText('Slug')).toBeRequired();
    expect(screen.getByLabelText('Email')).not.toBeRequired();
    expect(screen.getByLabelText('Foto')).not.toBeRequired();

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Northwind' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
    expect(create).toHaveBeenCalledWith({ name: 'Northwind', slug: 'northwind' }, undefined);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('sends optional email when provided', async () => {
    const create = vi.spyOn(api, 'createTenant').mockResolvedValue({
      email: 'ops@example.com',
      id: 'tenant-id',
      name: 'Northwind',
      slug: 'northwind',
    });
    render(<PortalRegisterTenantForm />);

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Northwind' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ops@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
    expect(create).toHaveBeenCalledWith(
      {
        email: 'ops@example.com',
        name: 'Northwind',
        slug: 'northwind',
      },
      undefined,
    );
  });

  it('asks for required name and slug before calling the API', async () => {
    const create = vi.spyOn(api, 'createTenant').mockResolvedValue({
      email: null,
      id: 'tenant-id',
      name: 'Northwind',
      slug: 'northwind',
    });
    render(<PortalRegisterTenantForm />);

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Preencha todos os campos obrigatórios.',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('shows the duplicate copy on 409', async () => {
    vi.spyOn(api, 'createTenant').mockRejectedValue(new ApiError('conflict', 409));
    render(<PortalRegisterTenantForm />);

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Acme' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'acme' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Já existe uma tenant com estes dados. Não é possível criar outra.',
    );
    expect(screen.getByLabelText('Nome Empresa')).toBeInTheDocument();
  });

  it('shows forbidden and generic failure copy', async () => {
    const create = vi.spyOn(api, 'createTenant').mockRejectedValue(new ApiError('denied', 403));
    render(<PortalRegisterTenantForm />);

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Northwind' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Você não tem permissão para esta ação.',
    );

    create.mockRejectedValueOnce(new ApiError('failed', 500));
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Não foi possível concluir a operação.',
    );
  });

  it('shows Cadastrando... while the request is in flight', async () => {
    let resolveCreate: (value: {
      email: string | null;
      id: string;
      name: string;
      slug: string;
    }) => void = () => undefined;
    vi.spyOn(api, 'createTenant').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render(<PortalRegisterTenantForm />);

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Northwind' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByRole('button', { name: 'Cadastrando...' })).toBeDisabled();

    resolveCreate({
      email: null,
      id: 'tenant-id',
      name: 'Northwind',
      slug: 'northwind',
    });

    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
  });

  it('closes without creating when Cancelar is pressed', () => {
    const create = vi.spyOn(api, 'createTenant');
    const onCancel = vi.fn();
    render(<PortalRegisterTenantForm onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a non-image photo without creating the tenant', () => {
    const create = vi.spyOn(api, 'createTenant');
    render(<PortalRegisterTenantForm />);

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Northwind' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.change(screen.getByLabelText('Foto'), {
      target: {
        files: [new File(['<svg/>'], 'mark.svg', { type: 'image/svg+xml' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'A foto deve ser uma imagem e ter no máximo 5 MB.',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('sends a selected photo with the tenant', async () => {
    const create = vi.spyOn(api, 'createTenant').mockResolvedValue({
      email: null,
      id: 'tenant-id',
      name: 'Northwind',
      slug: 'northwind',
    });
    const photo = new File([Uint8Array.from([137, 80, 78, 71])], 'mark.png', {
      type: 'image/png',
    });
    render(<PortalRegisterTenantForm />);

    fireEvent.change(screen.getByLabelText('Nome Empresa'), {
      target: { value: 'Northwind' },
    });
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'northwind' },
    });
    fireEvent.change(screen.getByLabelText('Foto'), {
      target: { files: [photo] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
    expect(create).toHaveBeenCalledWith({ name: 'Northwind', slug: 'northwind' }, photo);
  });
});
