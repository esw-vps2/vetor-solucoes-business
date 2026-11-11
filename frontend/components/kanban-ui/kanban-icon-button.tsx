'use client';

import type { ReactNode } from 'react';
import { focusRing } from './samples';

export function KanbanIconButton({
  accessibleName,
  children,
  onClick,
  variant = 'ghost',
}: {
  accessibleName: string;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'on-color' | 'outline' | 'selected';
}) {
  const frame =
    variant === 'selected'
      ? 'size-12 bg-[#f8fafc] text-[#1e293b]'
      : variant === 'outline'
        ? 'size-10 border border-[#cbd5e1] text-[#1e293b]'
        : variant === 'on-color'
          ? 'size-10 text-current'
          : 'size-10 text-[#1e293b]';

  return (
    <button
      type="button"
      aria-label={accessibleName}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${frame} ${focusRing}`}
    >
      {children}
    </button>
  );
}
