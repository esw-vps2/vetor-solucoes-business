import type { ReactNode } from 'react';
import Link from 'next/link';
import { KanbanBadge } from './kanban-badge';
import { focusRing } from './samples';

export function KanbanSidebarItem({
  badge,
  expanded,
  href,
  icon,
  label,
  onClick,
  active = false,
  className,
}: {
  badge?: string;
  expanded?: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  const classes = `flex min-h-12 w-[280px] cursor-pointer items-center gap-2 rounded-full px-3 py-2.5 text-left transition ${
    active ? 'bg-accent/15 text-accent' : 'text-[#1e293b] hover:bg-[#f8fafc]'
  } ${focusRing} ${className ?? ''}`;
  const content = (
    <>
      <span className={active ? 'text-accent' : 'text-[#1e293b]'}>{icon}</span>
      <span className="flex-1 text-base font-bold tracking-[-0.112px]">{label}</span>
      {badge ? <KanbanBadge>{badge}</KanbanBadge> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        scroll={false}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-current={expanded === undefined && active ? 'page' : undefined}
      aria-expanded={expanded}
      onClick={onClick}
      className={classes}
    >
      {content}
    </button>
  );
}
