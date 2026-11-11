'use client';

import { KanbanBadge } from './kanban-badge';
import { PlusIcon } from './icons/plus';
import { focusRing } from './samples';

const actionTone = {
  amber: { badge: 'white-on-amber' as const, fill: 'bg-[#f59e0b]' },
  green: { badge: 'white-on-green' as const, fill: 'bg-[#00c345]' },
  indigo: { badge: 'white-on-indigo' as const, fill: 'bg-[#4f46e5]' },
};

export function KanbanActionButton({
  accessibleName = 'Adicionar',
  count,
  label,
  onClick,
  tone = 'indigo',
}: {
  accessibleName?: string;
  count?: string;
  label?: string;
  onClick?: () => void;
  tone?: keyof typeof actionTone;
}) {
  const colors = actionTone[tone];

  return (
    <button
      type="button"
      aria-label={label ? undefined : accessibleName}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-full py-2 pr-3 pl-2 text-white ${colors.fill} ${focusRing}`}
    >
      <span className="flex flex-1 items-center gap-2">
        {count ? <KanbanBadge tone={colors.badge}>{count}</KanbanBadge> : null}
        {label ? <span className="text-base font-bold tracking-[-0.112px]">{label}</span> : null}
      </span>
      <PlusIcon className="size-6" />
    </button>
  );
}
