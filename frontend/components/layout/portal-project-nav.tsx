'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listProjectWorkspaces,
  listWorkspaceProjects,
  type ProjectSummary,
  type ProjectWorkspace,
} from '@/lib/api/client';
import { focusRing } from '@/components/kanban-ui/samples';
import { subscribeProjectNavRefresh } from '@/lib/project-nav-refresh';

export interface ProjectNavRow {
  projects: ProjectSummary[];
  workspace: ProjectWorkspace;
}

export function useProjectNavIndex(enabled: boolean, tenantId: string): ProjectNavRow[] {
  const [rows, setRows] = useState<ProjectNavRow[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const workspaces = await listProjectWorkspaces();
        const next = (
          await Promise.all(
            workspaces.map(async (workspace) => ({
              projects: await listWorkspaceProjects(workspace.id),
              workspace,
            })),
          )
        ).filter((row) => row.projects.length > 0);

        if (!active) {
          return;
        }

        setRows((current) => (current.length === 0 && next.length === 0 ? current : next));
      } catch {
        if (active) {
          setRows((current) => (current.length === 0 ? current : []));
        }
      }
    }

    void load();
    const unsubscribe = subscribeProjectNavRefresh(() => {
      void load();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, tenantId]);

  return rows;
}

export function projectNavMatchesQuery(rows: ProjectNavRow[], query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();

  if (!normalized) {
    return false;
  }

  return rows.some(
    (row) =>
      row.workspace.name.toLocaleLowerCase().includes(normalized) ||
      row.projects.some((project) => project.name.toLocaleLowerCase().includes(normalized)),
  );
}

function visibleProjectRows(rows: ProjectNavRow[], query: string): ProjectNavRow[] {
  const normalized = query.trim().toLocaleLowerCase();

  if (!normalized) {
    return rows;
  }

  return rows.flatMap((row) => {
    const workspaceMatches = row.workspace.name.toLocaleLowerCase().includes(normalized);
    const projects = workspaceMatches
      ? row.projects
      : row.projects.filter((project) => project.name.toLocaleLowerCase().includes(normalized));

    return projects.length > 0 ? [{ ...row, projects }] : [];
  });
}

export function PortalProjectNav({
  onNavigate,
  pathname,
  query,
  rows,
}: {
  onNavigate: () => void;
  pathname: string;
  query: string;
  rows: ProjectNavRow[];
}) {
  const visibleRows = visibleProjectRows(rows, query);

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Projetos criados" className="flex flex-col gap-2">
      {visibleRows.map((row) => (
        <li key={row.workspace.id}>
          <p className="truncate px-3 text-xs font-semibold text-[#64748b]">{row.workspace.name}</p>
          <ul className="mt-1 flex flex-col border-l border-[#e2e8f0] ml-5">
            {row.projects.map((project) => {
              const href = `/portal/projetos/${project.id}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <li key={project.id}>
                  <Link
                    href={href}
                    scroll={false}
                    aria-current={active ? 'page' : undefined}
                    onClick={onNavigate}
                    className={`block truncate rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active ? 'bg-accent/15 text-accent' : 'text-[#1e293b] hover:bg-[#f8fafc]'
                    } ${focusRing}`}
                  >
                    {project.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
