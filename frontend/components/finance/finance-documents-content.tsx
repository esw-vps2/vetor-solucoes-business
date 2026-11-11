'use client';

import { useEffect, useState } from 'react';
import {
  downloadFinanceProjectDocument,
  listFinanceProjectDocuments,
  uploadFinanceProjectDocument,
} from '@/lib/api/client';
import type { FinanceProject, FinanceProjectDocument } from '@/lib/api/client';
import {
  FINANCE_DOCUMENT_ACCEPT,
  isAllowedFinanceDocumentType,
  MAX_FINANCE_DOCUMENT_BYTES,
} from '@/lib/finance-documents';

const actionClass =
  'min-h-10 cursor-pointer rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy transition hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

export function FinanceDocumentsContent({
  project,
  onMessage,
}: {
  project: FinanceProject;
  onMessage: (value: string | null) => void;
}) {
  const [documents, setDocuments] = useState<FinanceProjectDocument[] | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listFinanceProjectDocuments(project.projectId)
      .then((items) => {
        if (active) {
          setDocuments(items);
        }
      })
      .catch(() => {
        if (active) {
          setDocuments([]);
          setOperationError('Não foi possível concluir a operação.');
        }
      });

    return () => {
      active = false;
    };
  }, [project.projectId]);

  function handleUpload(file: File | undefined): void {
    if (!file) {
      return;
    }

    setOperationError(null);
    setOperationMessage(null);
    onMessage(null);

    if (
      file.size < 1 ||
      file.size > MAX_FINANCE_DOCUMENT_BYTES ||
      !isAllowedFinanceDocumentType(file)
    ) {
      setOperationError('Não foi possível concluir a operação.');
      return;
    }

    setUploading(true);
    void uploadFinanceProjectDocument(project.projectId, file)
      .then(() => listFinanceProjectDocuments(project.projectId))
      .then((items) => {
        setDocuments(items);
        setOperationMessage('Operação realizada com sucesso.');
        onMessage('Operação realizada com sucesso.');
      })
      .catch(() => {
        setOperationError('Não foi possível concluir a operação.');
      })
      .finally(() => {
        setUploading(false);
      });
  }

  function handleDownload(document: FinanceProjectDocument): void {
    setOperationError(null);
    setOperationMessage(null);
    setDownloadingId(document.id);
    void downloadFinanceProjectDocument(project.projectId, document.id, document.originalName)
      .then(() => listFinanceProjectDocuments(project.projectId))
      .then((items) => {
        setDocuments(items);
      })
      .catch(() => {
        setOperationError('Não foi possível concluir a operação.');
      })
      .finally(() => {
        setDownloadingId(null);
      });
  }

  return (
    <div className="flex min-h-0 flex-col gap-5 text-navy">
      <div className="pr-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/50">
          Documentos privados
        </p>
        <h2 id="finance-documents-title" className="mt-2 text-2xl font-semibold">
          Arquivos de {project.projectName}
        </h2>
        <p className="mt-2 text-sm text-text-dark-secondary">
          {project.tenantName} · {project.workspaceName} · {project.projectName}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-navy/10 bg-off-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Adicionar documento</p>
          <p className="mt-1 text-sm text-text-dark-secondary">
            Até {Math.round(MAX_FINANCE_DOCUMENT_BYTES / 1024 / 1024)} MB por arquivo.
          </p>
        </div>
        <label className={`${actionClass} inline-flex items-center justify-center`}>
          Enviar arquivo
          <input
            className="sr-only"
            type="file"
            accept={FINANCE_DOCUMENT_ACCEPT}
            aria-label="Enviar arquivo"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>

      {operationError ? (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {operationError}
        </p>
      ) : null}
      {operationMessage ? (
        <p role="status" className="rounded-2xl bg-accent/15 px-4 py-3 text-sm text-navy">
          {operationMessage}
        </p>
      ) : null}

      {documents === null ? (
        <p role="status" className="py-5 text-sm text-text-dark-secondary">
          Carregando documentos...
        </p>
      ) : documents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy/15 px-4 py-8 text-center text-sm text-text-dark-secondary">
          Nenhum arquivo neste projeto.
        </p>
      ) : (
        <ul
          className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1"
          aria-label="Documentos do projeto"
        >
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-col gap-3 rounded-2xl border border-navy/10 bg-off-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words font-semibold">{document.originalName}</p>
                <p className="mt-1 text-xs text-text-dark-secondary">
                  {document.contentType} · {formatDocumentSize(document.byteSize)} ·{' '}
                  <time dateTime={document.createdAt}>
                    {formatDocumentDate(document.createdAt)}
                  </time>
                </p>
              </div>
              <button
                type="button"
                className={`${actionClass} shrink-0 self-start sm:self-auto`}
                disabled={downloadingId !== null || uploading}
                onClick={() => handleDownload(document)}
              >
                Baixar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDocumentSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

function formatDocumentDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
