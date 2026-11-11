'use client';

import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { KanbanBadge } from './kanban-badge';
import { focusRing } from './samples';

export type KanbanTab = {
  badge?: string;
  icon?: ReactNode;
  id: string;
  label: string;
};

export function KanbanTabItem({
  appearance = 'underline',
  badge,
  icon,
  label,
  selected,
  tabIndex,
  onKeyDown,
  onSelect,
}: {
  appearance?: 'underline' | 'segmented';
  badge?: string;
  icon?: ReactNode;
  label: string;
  selected: boolean;
  tabIndex: number;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onSelect: () => void;
}) {
  const underline = `inline-flex min-h-12 items-center justify-center gap-2.5 border-b-2 px-4 py-3 text-base font-bold tracking-[-0.112px] ${
    selected ? 'border-[#4f46e5] text-[#1e293b]' : 'border-[#cbd5e1] text-[#475569]'
  }`;
  const segmented = `inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold tracking-[-0.084px] ${
    selected ? 'bg-white text-[#1e293b] shadow-[0px_2px_4px_-2px_rgba(23,23,23,0.06)]' : 'text-[#475569]'
  }`;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`${appearance === 'segmented' ? segmented : underline} ${focusRing}`}
    >
      {appearance === 'segmented' && selected ? <span className="text-[#4f46e5]">{icon}</span> : icon}
      {label}
      {badge ? <KanbanBadge>{badge}</KanbanBadge> : null}
    </button>
  );
}

export function KanbanTabGroup({
  appearance = 'underline',
  label,
  selectedId,
  tabs,
}: {
  appearance?: 'underline' | 'segmented';
  label: string;
  selectedId?: string;
  tabs: KanbanTab[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(selectedId ?? tabs.find((tab) => tab.badge)?.id ?? tabs[0]?.id ?? '');

  function move(current: number, step: number) {
    const nextIndex = (current + step + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    if (!next) {
      return;
    }

    setSelected(next.id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={
        appearance === 'segmented'
          ? 'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#f1f5f9] p-1'
          : 'flex items-start overflow-x-auto'
      }
    >
      {tabs.map((tab, index) => (
        <KanbanTabItem
          key={tab.id}
          appearance={appearance}
          badge={tab.badge}
          icon={tab.icon}
          label={tab.label}
          selected={tab.id === selected}
          tabIndex={tab.id === selected ? 0 : -1}
          onSelect={() => setSelected(tab.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              move(index, 1);
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              move(index, -1);
            }
          }}
        />
      ))}
    </div>
  );
}
