'use client';

import type { MouseEventHandler, ReactNode } from 'react';
import { focusRing } from './samples';

export function KanbanButton({
  cardAction = false,
  children,
  icon,
  iconPosition = 'end',
  onClick,
  onMouseDown,
  size = 'md',
  tone = 'indigo',
  variant = 'filled',
}: {
  cardAction?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  onClick?: () => void;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  size?: 'md' | 'lg';
  tone?: 'indigo' | 'ink';
  variant?: 'filled' | 'outline' | 'text';
}) {
  const filled =
    size === 'lg'
      ? 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#4f46e5] px-5 py-3 text-sm font-bold tracking-[-0.084px] text-white'
      : 'inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#4f46e5] px-4 py-2.5 text-sm font-bold tracking-[-0.084px] text-white';
  const text = `inline-flex h-5 items-center justify-center gap-2 text-sm font-bold tracking-[-0.084px] ${
    tone === 'ink' ? 'text-[#1e293b]' : 'text-[#4f46e5]'
  }`;
  const outline =
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-bold tracking-[-0.084px] text-[#1e293b]';
  const frame = variant === 'text' ? text : variant === 'outline' ? outline : filled;

  return (
    <button
      type="button"
      data-card-action={cardAction ? 'true' : undefined}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={`${frame} ${focusRing}`}
    >
      {iconPosition === 'start' ? icon : null}
      {children}
      {iconPosition === 'end' ? icon : null}
    </button>
  );
}
