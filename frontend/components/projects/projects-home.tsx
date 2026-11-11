'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  createProjectWorkspace,
  createWorkspaceProject,
  deleteProject,
  deleteProjectWorkspace,
  listProjectWorkspaces,
  listTenants,
  listWorkspaceProjects,
  updateProject,
  updateProjectWorkspace,
  updateSessionTenant,
  type ProjectSummary,
  type ProjectWorkspace,
  type SafeUser,
  type TenantListItem,
} from '@/lib/api/client';
import { canManageProjectWorkspaces } from '@/lib/portal-actions';
import { notifyProjectNavRefresh } from '@/lib/project-nav-refresh';
import { PROJECT_COPY, projectErrorMessage } from '@/lib/project-kanban';

interface WorkspaceRow {
  projects: ProjectSummary[];
  workspace: ProjectWorkspace;
}

interface ProjectsHomeProps {
  onUserUpdated: (user: SafeUser) => void;
  user: SafeUser;
}

async function fetchBoardIndex(): Promise<WorkspaceRow[]> {
  const workspaces = await listProjectWorkspaces();
  return Promise.all(
    workspaces.map(async (workspace) => ({
      projects: await listWorkspaceProjects(workspace.id),
      workspace,
    })),
  );
}

export function ProjectsHome({ onUserUpdated, user }: ProjectsHomeProps) {
  const canManage = canManageProjectWorkspaces(user);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [workspaceDrafts, setWorkspaceDrafts] = useState<Record<string, string>>({});
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{ id: string; kind: 'workspace' | 'project' } | null>(
    null,
  );
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function applyBoardIndex(nextRows: WorkspaceRow[]) {
    setRows(nextRows);
    notifyProjectNavRefresh();
    setWorkspaceDrafts(
      Object.fromEntries(nextRows.map((row) => [row.workspace.id, row.workspace.name])),
    );
    setProjectDrafts(
      Object.fromEntries(
        nextRows.flatMap((row) => row.projects.map((project) => [project.id, project.name])),
      ),
    );
  }

  async function loadBoardIndex() {
    applyBoardIndex(await fetchBoardIndex());
  }

  useEffect(() => {
    let active = true;

    fetchBoardIndex()
      .then((nextRows) => {
        if (!active) {
          return;
        }

        setRows(nextRows);
        setWorkspaceDrafts(
          Object.fromEntries(nextRows.map((row) => [row.workspace.id, row.workspace.name])),
        );
        setProjectDrafts(
          Object.fromEntries(
            nextRows.flatMap((row) => row.projects.map((project) => [project.id, project.name])),
          ),
        );
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(projectErrorMessage(caught));
        }
      });

    if (user.profile === 'Administrador') {
      listTenants()
        .then((items) => {
          if (active) {
            setTenants(items);
          }
        })
        .catch((caught: unknown) => {
          if (active) {
            setError(projectErrorMessage(caught));
          }
        });
    }

    return () => {
      active = false;
    };
  }, [user.profile, user.tenantId]);

  async function run(action: () => Promise<void>) {
    setError('');
    setStatus('');

    try {
      await action();
      setStatus(PROJECT_COPY.success);
    } catch (caught) {
      setError(projectErrorMessage(caught));
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {user.profile === 'Administrador' ? (
        <label className="block max-w-sm text-sm font-medium text-navy dark:text-white">
          {PROJECT_COPY.tenant}
          <select
            value={user.tenantId}
            onChange={(event) => {
              void run(async () => {
                onUserUpdated(await updateSessionTenant(event.target.value));
                await loadBoardIndex();
              });
            }}
            className="mt-2 w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-navy-100 dark:text-white"
          >
            <option value="">{PROJECT_COPY.tenantPlaceholder}</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {canManage ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await createProjectWorkspace(workspaceName.trim());
              setWorkspaceName('');
              await loadBoardIndex();
            });
          }}
        >
          <label className="block text-sm font-medium text-navy dark:text-white">
            {PROJECT_COPY.newWorkspace}
            <input
              required
              maxLength={120}
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="mt-2 w-72 rounded-2xl border border-navy/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-navy-100 dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-navy"
          >
            {PROJECT_COPY.newWorkspace}
          </button>
        </form>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-sm text-text-dark-secondary dark:text-text-secondary">
          {PROJECT_COPY.emptyWorkspaces}
        </p>
      ) : (
        <ul className="space-y-8">
          {rows.map((row) => (
            <li
              key={row.workspace.id}
              className="rounded-[28px] border border-navy/10 bg-white p-6 dark:border-white/10 dark:bg-navy-100"
            >
              {canManage ? (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    maxLength={120}
                    value={workspaceDrafts[row.workspace.id] ?? row.workspace.name}
                    onChange={(event) =>
                      setWorkspaceDrafts((current) => ({
                        ...current,
                        [row.workspace.id]: event.target.value,
                      }))
                    }
                    className="min-w-48 flex-1 rounded-2xl border border-navy/10 bg-white px-4 py-2 text-lg font-semibold dark:border-white/15 dark:bg-navy-50 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void run(async () => {
                        await updateProjectWorkspace(
                          row.workspace.id,
                          (workspaceDrafts[row.workspace.id] ?? row.workspace.name).trim(),
                        );
                        await loadBoardIndex();
                      })
                    }
                    className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold dark:border-white/20 dark:text-white"
                  >
                    {PROJECT_COPY.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending({ id: row.workspace.id, kind: 'workspace' })}
                    className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold dark:border-white/20 dark:text-white"
                  >
                    {PROJECT_COPY.delete}
                  </button>
                </div>
              ) : (
                <h2 className="text-lg font-semibold text-navy dark:text-white">
                  {row.workspace.name}
                </h2>
              )}
              {pending?.kind === 'workspace' && pending.id === row.workspace.id ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-navy dark:text-white">
                    {PROJECT_COPY.confirmDeleteWorkspace}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void run(async () => {
                        await deleteProjectWorkspace(row.workspace.id);
                        setPending(null);
                        await loadBoardIndex();
                      })
                    }
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy"
                  >
                    {PROJECT_COPY.delete}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold dark:border-white/20 dark:text-white"
                  >
                    {PROJECT_COPY.cancel}
                  </button>
                </div>
              ) : null}
              {canManage ? (
                <form
                  className="mt-6 flex flex-wrap items-end gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      await createWorkspaceProject(
                        row.workspace.id,
                        (projectNames[row.workspace.id] ?? '').trim(),
                      );
                      setProjectNames((current) => ({ ...current, [row.workspace.id]: '' }));
                      await loadBoardIndex();
                    });
                  }}
                >
                  <label className="block text-sm font-medium text-navy dark:text-white">
                    {PROJECT_COPY.newProject}
                    <input
                      required
                      maxLength={120}
                      value={projectNames[row.workspace.id] ?? ''}
                      onChange={(event) =>
                        setProjectNames((current) => ({
                          ...current,
                          [row.workspace.id]: event.target.value,
                        }))
                      }
                      className="mt-2 w-72 rounded-2xl border border-navy/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-navy-50 dark:text-white"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-navy"
                  >
                    {PROJECT_COPY.newProject}
                  </button>
                </form>
              ) : null}
              {row.projects.length === 0 ? (
                <p className="mt-4 text-sm text-text-dark-secondary dark:text-text-secondary">
                  {PROJECT_COPY.emptyProjects}
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {row.projects.map((project) => (
                    <li key={project.id} className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/portal/projetos/${project.id}`}
                        className="text-base font-semibold text-navy underline-offset-4 hover:underline dark:text-white"
                      >
                        {project.name}
                      </Link>
                      {canManage ? (
                        <>
                          <input
                            maxLength={120}
                            value={projectDrafts[project.id] ?? project.name}
                            onChange={(event) =>
                              setProjectDrafts((current) => ({
                                ...current,
                                [project.id]: event.target.value,
                              }))
                            }
                            className="rounded-2xl border border-navy/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-navy-50 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              void run(async () => {
                                await updateProject(
                                  project.id,
                                  (projectDrafts[project.id] ?? project.name).trim(),
                                );
                                await loadBoardIndex();
                              })
                            }
                            className="rounded-full border border-navy/15 px-3 py-1.5 text-sm font-semibold dark:border-white/20 dark:text-white"
                          >
                            {PROJECT_COPY.save}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPending({ id: project.id, kind: 'project' })}
                            className="rounded-full border border-navy/15 px-3 py-1.5 text-sm font-semibold dark:border-white/20 dark:text-white"
                          >
                            {PROJECT_COPY.delete}
                          </button>
                        </>
                      ) : null}
                      {pending?.kind === 'project' && pending.id === project.id ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm text-navy dark:text-white">
                            {PROJECT_COPY.confirmDeleteProject}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              void run(async () => {
                                await deleteProject(project.id);
                                setPending(null);
                                await loadBoardIndex();
                              })
                            }
                            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-navy"
                          >
                            {PROJECT_COPY.delete}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPending(null)}
                            className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold dark:border-white/20 dark:text-white"
                          >
                            {PROJECT_COPY.cancel}
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p role="status" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="text-sm text-text-dark-secondary dark:text-text-secondary">
          {status}
        </p>
      ) : null}
    </div>
  );
}
