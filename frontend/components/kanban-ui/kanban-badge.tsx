import type { ReactNode } from 'react';

export type KanbanBadgeTone =
  | 'soft-amber'
  | 'soft-rose'
  | 'outline'
  | 'soft-green'
  | 'soft-indigo'
  | 'solid-indigo'
  | 'solid-rose'
  | 'solid-amber'
  | 'solid-green'
  | 'solid-slate'
  | 'white-on-indigo'
  | 'white-on-amber'
  | 'white-on-green';

const toneClass: Record<KanbanBadgeTone, string> = {
  outline: 'border border-[#cbd5e1] bg-white text-[#1e293b]',
  'soft-amber': 'bg-[#fef3c7] text-[#f59e0b]',
  'soft-rose': 'bg-[#ffe4e6] text-[#f43f5e]',
  'soft-green': 'bg-[#dcfce7] text-[#00c345]',
  'soft-indigo': 'border border-[#a5b4fc] bg-[#eef2ff] text-[#4f46e5]',
  'solid-amber': 'bg-[#f59e0b] text-white',
  'solid-green': 'bg-[#00c345] text-white',
  'solid-indigo': 'bg-[#4f46e5] text-white',
  'solid-rose': 'bg-[#f43f5e] text-white',
  'solid-slate': 'bg-[#94a3b8] text-white',
  'white-on-amber': 'bg-white text-[#f59e0b]',
  'white-on-green': 'bg-white text-[#00c345]',
  'white-on-indigo': 'bg-white text-[#4f46e5]',
};

export function KanbanBadge({
  children,
  tone = 'soft-indigo',
}: {
  children: ReactNode;
  tone?: KanbanBadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold tracking-[-0.06px] ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
