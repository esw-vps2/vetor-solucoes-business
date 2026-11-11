import { KanbanLogomark } from './kanban-logomark';

export function KanbanPlaceholderLogo({ size = 48 }: { size?: 48 | 96 }) {
  return <KanbanLogomark className={size === 96 ? 'size-24' : 'size-12'} />;
}
