'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  createProjectFolder,
  deleteProjectDocument,
  projectDocumentSrc,
  projectFolderArchiveSrc,
  updateProjectDocument,
  uploadProjectDocuments,
  type ProjectBoard,
  type ProjectDocument,
} from '@/lib/api/client';
import { Modal } from '@/components/ui/modal';
import {
  canPreviewProjectFile,
  fileRelativePath,
  folderUploadBytes,
  isAllowedProjectFile,
  MAX_PROJECT_TREE_BYTES,
  PROJECT_COPY,
  PROJECT_FILE_ACCEPT,
  type ProjectErrorKind,
} from '@/lib/project-kanban';

type FilesToolbarAction = 'newFolder' | 'uploadFile' | 'uploadFolder';

const filesToolbarIdleClass =
  'inline-flex min-h-10 items-center rounded-full border border-navy/15 px-3 py-2 text-xs font-semibold dark:border-white/20 dark:text-white';
const filesToolbarSelectedClass =
  'inline-flex min-h-10 items-center rounded-full bg-accent px-3 py-2 text-xs font-semibold text-navy';

function filesToolbarClass(selected: boolean) {
  return selected ? filesToolbarSelectedClass : filesToolbarIdleClass;
}

interface ProjectFilesPanelProps {
  board: ProjectBoard;
  onClientError: (message: string) => void;
  onClose: () => void;
  onReload: () => Promise<void>;
  onRun: (action: () => Promise<void>, problem?: ProjectErrorKind) => Promise<void>;
}

export function ProjectFilesPanel({
  board,
  onClientError,
  onClose,
  onReload,
  onRun,
}: ProjectFilesPanelProps) {
  const [folderName, setFolderName] = useState('');
  const [toolbarAction, setToolbarAction] = useState<FilesToolbarAction>('uploadFile');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const creatingFolder = toolbarAction === 'newFolder';

  return (
    <aside className="flex max-h-[min(24rem,50svh)] w-full flex-col overflow-y-auto rounded-[24px] border border-white/20 bg-white/90 p-4 backdrop-blur-md lg:h-full lg:max-h-none lg:w-80 lg:min-h-0 dark:bg-navy-100/80">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-navy dark:text-white">
          {PROJECT_COPY.projectFiles}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold dark:border-white/20 dark:text-white"
        >
          {PROJECT_COPY.cancel}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label
          aria-current={toolbarAction === 'uploadFile' ? 'true' : undefined}
          className={filesToolbarClass(toolbarAction === 'uploadFile')}
          onClick={() => setToolbarAction('uploadFile')}
        >
          {PROJECT_COPY.uploadFile}
          <input
            type="file"
            accept={PROJECT_FILE_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) {
                return;
              }

              if (!isAllowedProjectFile(file)) {
                onClientError(PROJECT_COPY.invalidFile);
                return;
              }

              void onRun(async () => {
                await uploadProjectDocuments(board.id, [file], null, [file.name]);
                await onReload();
              }, 'file');
            }}
          />
        </label>
        <label
          aria-current={toolbarAction === 'uploadFolder' ? 'true' : undefined}
          className={filesToolbarClass(toolbarAction === 'uploadFolder')}
          onClick={() => setToolbarAction('uploadFolder')}
        >
          {PROJECT_COPY.uploadFolder}
          <input
            type="file"
            multiple
            className="sr-only"
            ref={(node) => {
              if (node) {
                node.setAttribute('webkitdirectory', '');
                node.setAttribute('directory', '');
              }
            }}
            onChange={(event) => {
              const files = [...(event.target.files ?? [])];
              event.target.value = '';
              if (files.length === 0) {
                return;
              }

              if (files.some((file) => !isAllowedProjectFile(file))) {
                onClientError(PROJECT_COPY.invalidFile);
                return;
              }

              if (folderUploadBytes(files) > MAX_PROJECT_TREE_BYTES) {
                onClientError(PROJECT_COPY.invalidFolderTotal);
                return;
              }

              void onRun(async () => {
                await uploadProjectDocuments(board.id, files, null, files.map(fileRelativePath));
                await onReload();
              }, 'folder');
            }}
          />
        </label>
        <button
          type="button"
          aria-current={toolbarAction === 'newFolder' ? 'true' : undefined}
          onClick={() => setToolbarAction('newFolder')}
          className={filesToolbarClass(toolbarAction === 'newFolder')}
        >
          {PROJECT_COPY.newFolder}
        </button>
      </div>
      {creatingFolder ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onRun(async () => {
              await createProjectFolder(board.id, folderName.trim(), null);
              setFolderName('');
              setToolbarAction('uploadFile');
              await onReload();
            });
          }}
        >
          <input
            required
            maxLength={120}
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-navy/10 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-navy-50 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-navy"
          >
            {PROJECT_COPY.save}
          </button>
        </form>
      ) : null}
      {board.documents.length === 0 ? (
        <p className="mt-4 text-sm text-text-dark-secondary dark:text-text-secondary">
          {PROJECT_COPY.emptyDocuments}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {board.documents.map((node) => (
            <DocumentNode
              key={node.id}
              node={node}
              pendingId={pendingId}
              projectId={board.id}
              onPending={setPendingId}
              onReload={onReload}
              onRun={onRun}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

function DocumentNode({
  node,
  pendingId,
  projectId,
  onPending,
  onReload,
  onRun,
}: {
  node: ProjectDocument;
  pendingId: string | null;
  projectId: string;
  onPending: (id: string | null) => void;
  onReload: () => Promise<void>;
  onRun: (action: () => Promise<void>, problem?: ProjectErrorKind) => Promise<void>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(node.originalName);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const previewTitleId = `preview-${node.id}`;
  const confirmCopy =
    node.kind === 'folder' ? PROJECT_COPY.confirmDeleteFolder : PROJECT_COPY.confirmDeleteFile;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function closePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  }

  async function openPreview() {
    if (!node.url || !canPreviewProjectFile(node.contentType)) {
      setPreviewMessage(PROJECT_COPY.previewUnavailable);
      return;
    }

    setPreviewMessage(null);

    try {
      const response = await fetch(projectDocumentSrc(node.url), { credentials: 'include' });

      if (!response.ok) {
        setPreviewMessage(PROJECT_COPY.genericFailure);
        return;
      }

      const blob = await response.blob();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch {
      setPreviewMessage(PROJECT_COPY.genericFailure);
    }
  }

  return (
    <li className="rounded-2xl border border-navy/10 p-2 dark:border-white/15">
      <p className="text-sm font-semibold text-navy dark:text-white">{node.originalName}</p>
      <p className="text-xs text-text-dark-secondary dark:text-text-secondary">
        {PROJECT_COPY.uploadedBy} {node.createdByFirstName} {node.createdByLastName}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {node.kind === 'file' && node.url ? (
          <a
            href={projectDocumentSrc(node.url)}
            className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold dark:border-white/20 dark:text-white"
          >
            {PROJECT_COPY.download}
          </a>
        ) : (
          <a
            href={projectFolderArchiveSrc(projectId, node.id)}
            className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold dark:border-white/20 dark:text-white"
          >
            {PROJECT_COPY.downloadFolder}
          </a>
        )}
        <button
          type="button"
          onClick={() => setRenaming(true)}
          className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold dark:border-white/20 dark:text-white"
        >
          {PROJECT_COPY.rename}
        </button>
        {node.kind === 'file' ? (
          <button
            type="button"
            onClick={() => {
              void openPreview();
            }}
            className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold dark:border-white/20 dark:text-white"
          >
            {PROJECT_COPY.preview}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onPending(node.id)}
          className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold dark:border-white/20 dark:text-white"
        >
          {PROJECT_COPY.delete}
        </button>
      </div>
      {previewMessage ? (
        <p role="status" className="mt-2 text-xs text-navy dark:text-white">
          {previewMessage}
        </p>
      ) : null}
      {previewUrl ? (
        <Modal labelledBy={previewTitleId} onClose={closePreview} open size="viewport" tone="light">
          <h2 id={previewTitleId} className="pr-12 text-lg font-semibold">
            {node.originalName}
          </h2>
          {node.contentType === 'application/pdf' ? (
            <iframe
              title={node.originalName}
              src={previewUrl}
              className="mt-4 min-h-0 w-full flex-1 rounded-2xl border border-navy/10"
            />
          ) : (
            <img
              alt={node.originalName}
              src={previewUrl}
              className="mt-4 min-h-0 w-full flex-1 object-contain"
            />
          )}
        </Modal>
      ) : null}
      {renaming ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void onRun(async () => {
              await updateProjectDocument(projectId, node.id, { name: name.trim() });
              setRenaming(false);
              await onReload();
            });
          }}
        >
          <input
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-navy/10 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-navy-50 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-navy"
          >
            {PROJECT_COPY.save}
          </button>
        </form>
      ) : null}
      {pendingId === node.id ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-navy dark:text-white">{confirmCopy}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                void onRun(async () => {
                  await deleteProjectDocument(projectId, node.id);
                  onPending(null);
                  await onReload();
                })
              }
              className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-navy"
            >
              {PROJECT_COPY.delete}
            </button>
            <button
              type="button"
              onClick={() => onPending(null)}
              className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold dark:border-white/20 dark:text-white"
            >
              {PROJECT_COPY.cancel}
            </button>
          </div>
        </div>
      ) : null}
      {node.children.length > 0 ? (
        <ul className="mt-2 space-y-2 pl-3">
          {node.children.map((child) => (
            <DocumentNode
              key={child.id}
              node={child}
              pendingId={pendingId}
              projectId={projectId}
              onPending={onPending}
              onReload={onReload}
              onRun={onRun}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
