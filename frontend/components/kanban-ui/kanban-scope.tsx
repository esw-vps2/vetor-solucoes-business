import type { ReactNode } from 'react';
import { kanbanFont } from './font';

export function KanbanScope({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`kanban-ui ${kanbanFont.className} ${className}`}>{children}</div>;
}
