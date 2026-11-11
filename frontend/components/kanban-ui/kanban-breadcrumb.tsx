'use client';

import type { ReactNode } from 'react';
import { KanbanIconButton } from './kanban-icon-button';
import { HouseSimpleIcon } from './icons/house-simple';
import { CaretRightIcon } from './icons/caret-right';
import { focusRing } from './samples';

export type KanbanCrumb = {
  current?: boolean;
  icon?: ReactNode;
  label: string;
  onSelect?: () => void;
};

export function KanbanBreadcrumbItem({ crumb }: { crumb: KanbanCrumb }) {
  return (
    <button
      type="button"
      aria-current={crumb.current ? 'page' : undefined}
      onClick={crumb.onSelect}
      className={`inline-flex items-center gap-1 text-sm font-bold tracking-[-0.084px] ${
        crumb.current ? 'text-[#4f46e5]' : 'text-[#475569]'
      } ${focusRing}`}
    >
      {crumb.icon}
      {crumb.label}
    </button>
  );
}

export function KanbanBreadcrumb({ items }: { items: KanbanCrumb[] }) {
  return (
    <nav aria-label="Trilha" className="flex items-center gap-2">
      <KanbanIconButton accessibleName="Início">
        <HouseSimpleIcon className="size-5" />
      </KanbanIconButton>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <CaretRightIcon className="size-5 text-[#475569]" />
          <KanbanBreadcrumbItem crumb={item} />
        </span>
      ))}
    </nav>
  );
}
