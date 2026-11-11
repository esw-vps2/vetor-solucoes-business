'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ApiError,
  deleteTenantPhoto,
  isPhotoFile,
  listTenants,
  publicPhotoSrc,
  replaceTenantPhoto,
  tenantPhotoApiPath,
} from '@/lib/api/client';
import type { TenantListItem } from '@/lib/api/client';

interface PortalReplaceTenantPhotoFormProps {
  onCancel?: () => void;
  onSuccess?: (tenantId: string) => void;
  workingTenantId: string;
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none';

const noChangesCopy = 'Selecione uma foto ou exclua a foto atual para salvar.';
const invalidPhotoCopy = 'A foto deve ser uma imagem e ter no máximo 5 MB.';
const forbiddenCopy = 'Você não tem permissão para esta ação.';
const genericCopy = 'Não foi possível concluir a operação.';
const successCopy = 'Operação realizada com sucesso.';

function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return forbiddenCopy;
    }

    if (error.status === 400) {
      return invalidPhotoCopy;
    }
  }

  return genericCopy;
}

export function PortalReplaceTenantPhotoForm({
  onCancel,
  onSuccess,
  workingTenantId,
}: PortalReplaceTenantPhotoFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [tenantId, setTenantId] = useState(workingTenantId);
  const [photo, setPhoto] = useState<File | undefined>();
  const [remoteRevision, setRemoteRevision] = useState(0);
  const [storedPhotoAvailable, setStoredPhotoAvailable] = useState(false);
  const [remotePhotoFailed, setRemotePhotoFailed] = useState(false);
  const [removeStoredPhoto, setRemoveStoredPhoto] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const selectedTenantName = tenants.find((tenant) => tenant.id === tenantId)?.name ?? 'Tenant';

  const photoPreviewUrl = useMemo(() => {
    if (!photo || !isPhotoFile(photo)) {
      return '';
    }

    return URL.createObjectURL(photo);
  }, [photo]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const [photoTenantId, setPhotoTenantId] = useState(tenantId);

  if (photoTenantId !== tenantId) {
    setPhotoTenantId(tenantId);
    setRemoteRevision((value) => value + 1);
    setStoredPhotoAvailable(false);
    setRemotePhotoFailed(false);
    setRemoveStoredPhoto(false);
    setPhoto(undefined);
  }

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [tenantId]);

  useEffect(() => {
    let active = true;

    listTenants()
      .then((rows) => {
        if (!active) {
          return;
        }

        setTenants(rows);
        setTenantId((current) =>
          rows.some((tenant) => tenant.id === current) ? current : (rows[0]?.id ?? ''),
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(genericCopy);
      });

    return () => {
      active = false;
    };
  }, []);

  const remotePhotoSrc =
    tenantId && !photoPreviewUrl && !removeStoredPhoto
      ? `${publicPhotoSrc(tenantPhotoApiPath(tenantId))}?r=${remoteRevision}`
      : '';

  const previewSrc = photoPreviewUrl || remotePhotoSrc;
  const showPreview =
    Boolean(previewSrc) && (Boolean(photoPreviewUrl) || (!remotePhotoFailed && !removeStoredPhoto));

  const willReplace = Boolean(photo && isPhotoFile(photo));
  const willDeleteStored = removeStoredPhoto && storedPhotoAvailable;
  const isDirty = willReplace || willDeleteStored;

  function resetPhotoSelection() {
    setPhoto(undefined);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function clearPhotoPreview() {
    if (photoPreviewUrl) {
      resetPhotoSelection();
      return;
    }

    if (storedPhotoAvailable || remotePhotoSrc) {
      setRemoveStoredPhoto(true);
    }
  }

  function handleTenantChange(nextTenantId: string) {
    setTenantId(nextTenantId);

    if (status === 'error') {
      setStatus('idle');
      setMessage('');
    }
  }

  function handlePhotoChange(file: File | undefined) {
    setPhoto(file);
    setRemoveStoredPhoto(false);

    if (file && !isPhotoFile(file)) {
      setStatus('error');
      setMessage(invalidPhotoCopy);
      return;
    }

    if (status === 'error' && message === invalidPhotoCopy) {
      setStatus('idle');
      setMessage('');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (photo && !isPhotoFile(photo)) {
      setStatus('error');
      setMessage(invalidPhotoCopy);
      return;
    }

    if (!tenantId || !isDirty) {
      setStatus('error');
      setMessage(noChangesCopy);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      if (willReplace && photo) {
        await replaceTenantPhoto(tenantId, photo);
      } else if (willDeleteStored) {
        await deleteTenantPhoto(tenantId);
      }

      setStatus('success');
      setMessage(successCopy);
      resetPhotoSelection();
      setRemoveStoredPhoto(false);
      setStoredPhotoAvailable(false);
      setRemotePhotoFailed(false);
      setRemoteRevision((value) => value + 1);
      onSuccess?.(tenantId);
    } catch (error) {
      setStatus('error');
      setMessage(messageForError(error));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-navy">
      <label className="block text-sm font-medium">
        Tenant
        <select
          required
          value={tenantId}
          onChange={(event) => handleTenantChange(event.target.value)}
          className={fieldClass}
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </label>
      <div>
        <p className="text-sm font-medium">Foto</p>
        {showPreview ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div
              className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-navy/15 bg-off-white"
              data-testid="tenant-photo-preview"
            >
              <img
                key={previewSrc}
                alt={selectedTenantName}
                src={previewSrc}
                onLoad={() => {
                  if (!photoPreviewUrl) {
                    setStoredPhotoAvailable(true);
                    setRemotePhotoFailed(false);
                  }
                }}
                onError={() => {
                  if (!photoPreviewUrl) {
                    setRemotePhotoFailed(true);
                    setStoredPhotoAvailable(false);
                  }
                }}
                className="absolute inset-0 block h-full w-full max-h-full max-w-full object-contain object-center"
              />
            </div>
            <button
              type="button"
              onClick={clearPhotoPreview}
              className="text-sm font-semibold text-red-600 transition hover:text-red-700 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Excluir foto
            </button>
          </div>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Foto"
          onChange={(event) => handlePhotoChange(event.target.files?.[0])}
          className={`${fieldClass} file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:font-semibold file:text-navy`}
        />
      </div>
      {message ? (
        <p
          role="status"
          className={status === 'error' ? 'text-sm text-red-600' : 'text-sm text-text-dark-secondary'}
        >
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {status === 'loading' ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/30 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
