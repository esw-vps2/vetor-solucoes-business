import type { DragEvent, ReactNode } from 'react';
import { KanbanDot } from './kanban-dot';
import { KanbanIconButton } from './kanban-icon-button';
import { MinusIcon } from './icons/minus';
import { PlusIcon } from './icons/plus';
import { DotsThreeIcon } from './icons/dots-three';

export function KanbanLaneHeader({
  addLabel,
  count,
  dotColor,
  draggable = false,
  menu,
  onAdd,
  onDragEnd,
  onDragStart,
  onRemove,
  removeLabel,
  title,
  titleSlot,
  variant = 'project',
  ink = 'light',
}: {
  addLabel?: string;
  count?: number;
  dotColor?: string;
  draggable?: boolean;
  ink?: 'dark' | 'light';
  menu?: ReactNode;
  onAdd?: () => void;
  onDragEnd?: () => void;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onRemove?: () => void;
  removeLabel?: string;
  title: string;
  titleSlot?: ReactNode;
  variant?: 'launch' | 'pill' | 'project';
}) {
  if (variant === 'pill') {
    const text = ink === 'dark' ? 'text-navy' : 'text-white';

    return (
      <div
        aria-label={draggable ? title : undefined}
        draggable={draggable}
        role={draggable ? 'group' : undefined}
        onDragStart={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('input, textarea')) {
            event.preventDefault();
            return;
          }
          const button = target.closest('button');
          if (button && !button.closest('h2')) {
            event.preventDefault();
            return;
          }
          onDragStart?.(event);
        }}
        onDragEnd={onDragEnd}
        className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full px-1.5 py-1.5 ${text} ${
          draggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        style={{ backgroundColor: dotColor ?? '#64748B' }}
      >
        {count !== undefined ? (
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-sm font-bold text-[#1e293b]">
            {count}
          </span>
        ) : null}
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{titleSlot ?? title}</h2>
        {onRemove && removeLabel ? (
          <KanbanIconButton accessibleName={removeLabel} variant="on-color" onClick={onRemove}>
            <MinusIcon className="size-5" />
          </KanbanIconButton>
        ) : null}
        {onAdd && addLabel ? (
          <KanbanIconButton accessibleName={addLabel} variant="on-color" onClick={onAdd}>
            <PlusIcon className="size-5" />
          </KanbanIconButton>
        ) : null}
        {menu}
      </div>
    );
  }

  if (variant === 'launch') {
    return (
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#1e293b]">{title}</h2>
        <span className="inline-flex items-center gap-2 text-[#1e293b]">
          <PlusIcon className="size-6" />
          <DotsThreeIcon className="size-6" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <KanbanDot color={dotColor} />
      <h2 className="text-lg font-semibold text-[#1e293b]">{title}</h2>
      {count !== undefined ? (
        <span className="flex-1 text-lg font-semibold text-[#1e293b]">({count})</span>
      ) : (
        <span className="flex-1" />
      )}
      {onAdd && addLabel ? (
        <KanbanIconButton accessibleName={addLabel} onClick={onAdd}>
          <PlusIcon className="size-5" />
        </KanbanIconButton>
      ) : null}
      {menu}
    </div>
  );
}
