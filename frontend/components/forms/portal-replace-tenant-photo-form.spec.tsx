import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { PortalReplaceTenantPhotoForm } from './portal-replace-tenant-photo-form';

describe('PortalReplaceTenantPhotoForm', () => {
  function dismissStoredPhotoPreview(name: string) {
    const preview = screen.queryByRole('img', { name });
    if (preview) {
      fireEvent.error(preview);
    }
  }

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('requires a change before calling the API', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-id', name: 'VETOR', slug: 'vetor' },
    ]);
    const replace = vi.spyOn(api, 'replaceTenantPhoto');
    const remove = vi.spyOn(api, 'deleteTenantPhoto');
    render(<PortalReplaceTenantPhotoForm workingTenantId="vetor-id" onSuccess={() => undefined} />);

    expect(await screen.findByRole('option', { name: 'VETOR' })).toBeInTheDocument();
    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Selecione uma foto ou exclua a foto atual para salvar.',
    );
    expect(replace).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('replaces the selected tenant photo', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-id', name: 'VETOR', slug: 'vetor' },
      { id: 'acme-id', name: 'Acme', slug: 'acme' },
    ]);
    const replace = vi.spyOn(api, 'replaceTenantPhoto').mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const photo = new File([Uint8Array.from([137, 80, 78, 71])], 'mark.png', {
      type: 'image/png',
    });
    render(<PortalReplaceTenantPhotoForm workingTenantId="vetor-id" onSuccess={onSuccess} />);

    expect(await screen.findByRole('option', { name: 'Acme' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tenant'), { target: { value: 'acme-id' } });
    fireEvent.change(screen.getByLabelText('Foto'), { target: { files: [photo] } });
    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
    expect(replace).toHaveBeenCalledWith('acme-id', photo);
    expect(onSuccess).toHaveBeenCalledWith('acme-id');
  });

  it('shows a cropped preview when a valid photo is selected', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-id', name: 'VETOR', slug: 'vetor' },
    ]);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(api, 'publicPhotoSrc').mockImplementation((path) => `https://api.test${path}`);
    const photo = new File([Uint8Array.from([137, 80, 78, 71])], 'mark.png', {
      type: 'image/png',
    });
    render(<PortalReplaceTenantPhotoForm workingTenantId="vetor-id" onSuccess={() => undefined} />);

    expect(await screen.findByRole('option', { name: 'VETOR' })).toBeInTheDocument();
    dismissStoredPhotoPreview('VETOR');
    fireEvent.change(screen.getByLabelText('Foto'), { target: { files: [photo] } });

    const frame = screen.getByTestId('tenant-photo-preview');
    const preview = screen.getByRole('img', { name: 'VETOR' });
    expect(preview).toHaveAttribute('src', 'blob:preview');
    expect(preview).toHaveClass('object-contain');
    expect(frame).toHaveClass('overflow-hidden', 'rounded-2xl');
    expect(createObjectURL).toHaveBeenCalledWith(photo);
  });

  it('loads the stored tenant photo when the tenant changes', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-id', name: 'VETOR', slug: 'vetor' },
      { id: 'acme-id', name: 'Acme', slug: 'acme' },
    ]);
    vi.spyOn(api, 'publicPhotoSrc').mockImplementation(
      (path) => `https://api.test${path}`,
    );
    render(<PortalReplaceTenantPhotoForm workingTenantId="vetor-id" onSuccess={() => undefined} />);

    expect(await screen.findByRole('option', { name: 'Acme' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tenant'), { target: { value: 'acme-id' } });

    const preview = await screen.findByRole('img', { name: 'Acme' });
    expect(preview.getAttribute('src')).toContain('/api/v1/tenants/acme-id/photo');
    fireEvent.load(preview);
  });

  it('deletes the stored photo after Excluir foto and Salvar', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-id', name: 'VETOR', slug: 'vetor' },
    ]);
    vi.spyOn(api, 'publicPhotoSrc').mockImplementation(
      (path) => `https://api.test${path}`,
    );
    const remove = vi.spyOn(api, 'deleteTenantPhoto').mockResolvedValue(undefined);
    render(<PortalReplaceTenantPhotoForm workingTenantId="vetor-id" onSuccess={() => undefined} />);

    expect(await screen.findByRole('option', { name: 'VETOR' })).toBeInTheDocument();
    const preview = await screen.findByRole('img', { name: 'VETOR' });
    fireEvent.load(preview);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir foto' }));
    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'VETOR' })).not.toBeInTheDocument();
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(await screen.findByRole('status')).toHaveTextContent('Operação realizada com sucesso.');
    expect(remove).toHaveBeenCalledWith('vetor-id');
  });

  it('clears a newly selected file when Excluir foto is clicked', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-id', name: 'VETOR', slug: 'vetor' },
    ]);
    const photo = new File([Uint8Array.from([137, 80, 78, 71])], 'mark.png', {
      type: 'image/png',
    });
    vi.spyOn(api, 'publicPhotoSrc').mockImplementation((path) => `https://api.test${path}`);
    render(<PortalReplaceTenantPhotoForm workingTenantId="vetor-id" onSuccess={() => undefined} />);

    expect(await screen.findByRole('option', { name: 'VETOR' })).toBeInTheDocument();
    dismissStoredPhotoPreview('VETOR');
    fireEvent.change(screen.getByLabelText('Foto'), { target: { files: [photo] } });
    expect(screen.getByRole('img', { name: 'VETOR' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir foto' }));
    dismissStoredPhotoPreview('VETOR');

    expect(screen.queryByRole('img', { name: 'VETOR' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Foto')).toHaveValue('');
  });

  it('rejects a non-image file without calling the API', async () => {
    vi.spyOn(api, 'listTenants').mockResolvedValue([
      { id: 'vetor-id', name: 'VETOR', slug: 'vetor' },
    ]);
    const replace = vi.spyOn(api, 'replaceTenantPhoto');
    vi.spyOn(api, 'publicPhotoSrc').mockImplementation((path) => `https://api.test${path}`);
    render(<PortalReplaceTenantPhotoForm workingTenantId="vetor-id" onSuccess={() => undefined} />);

    expect(await screen.findByRole('option', { name: 'VETOR' })).toBeInTheDocument();
    dismissStoredPhotoPreview('VETOR');
    fireEvent.change(screen.getByLabelText('Foto'), {
      target: {
        files: [new File(['<svg/>'], 'mark.svg', { type: 'image/svg+xml' })],
      },
    });

    expect(screen.queryByRole('img', { name: 'VETOR' })).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole('button', { name: 'Salvar' }).closest('form')!);

    expect(screen.getByRole('status')).toHaveTextContent(
      'A foto deve ser uma imagem e ter no máximo 5 MB.',
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
