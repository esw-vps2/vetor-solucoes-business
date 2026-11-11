'use client';

import { KanbanButton } from './kanban-button';
import { KanbanIconButton } from './kanban-icon-button';
import { WarningIcon } from './icons/warning';
import { XIcon } from './icons/x';

export function KanbanFeaturedCard({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <aside className="flex w-[280px] flex-col gap-4 rounded-[24px] bg-[#f8fafc] p-4">
      <div className="flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-full bg-[#e2e8f0] text-[#475569]">
          <WarningIcon className="size-5" />
        </span>
        <KanbanIconButton accessibleName="Fechar" onClick={onDismiss}>
          <XIcon className="size-5" />
        </KanbanIconButton>
      </div>
      <p className="text-sm leading-relaxed text-[#475569]">
        Tenha acesso ilimitado ao aplicativo por um pequeno valor mensal.
      </p>
      <div className="flex gap-4">
        <KanbanButton variant="text" onClick={onDismiss}>
          Dispensar
        </KanbanButton>
        <KanbanButton variant="text">Seja Pro</KanbanButton>
      </div>
    </aside>
  );
}
