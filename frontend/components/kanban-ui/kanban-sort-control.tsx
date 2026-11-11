import { KanbanBadge } from './kanban-badge';

export function KanbanSortControl({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-[#475569]">Ordenar por</span>
      <KanbanBadge>{value}</KanbanBadge>
    </div>
  );
}
