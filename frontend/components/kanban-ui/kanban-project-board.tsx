'use client';

import { KanbanAppSidebar } from './kanban-app-sidebar';
import { KanbanAvatarGroup } from './kanban-avatar-group';
import { KanbanBreadcrumb } from './kanban-breadcrumb';
import { KanbanButton } from './kanban-button';
import { KanbanIconButton } from './kanban-icon-button';
import { KanbanLaneHeader } from './kanban-lane-header';
import { KanbanPlaceholderLogo } from './kanban-placeholder-logo';
import { KanbanScope } from './kanban-scope';
import { KanbanTabGroup } from './kanban-tab-group';
import { KanbanTaskCard } from './kanban-task-card';
import { KIT_AVATARS } from './samples';
import { ColumnsIcon } from './icons/columns';
import { FilterIcon } from './icons/filter';
import { GridIcon } from './icons/grid';
import { ListIcon } from './icons/list';
import { MagnifyingGlassIcon } from './icons/magnifying-glass';
import { PlusIcon } from './icons/plus';
import { RowsIcon } from './icons/rows';
import { SortIcon } from './icons/sort';
import { SphereIcon } from './icons/sphere';
import { UploadIcon } from './icons/upload';
import { useNarrowScreen } from './use-narrow-screen';

function faces(count: number, start = 0) {
  return Array.from({ length: count }, (_, index) => ({
    src: KIT_AVATARS[(start + index) % KIT_AVATARS.length],
  }));
}

const lanes = [
  {
    cards: [
      {
        avatars: faces(2),
        badge: 'Importante',
        checkCount: 187,
        commentCount: 11,
        progress: 0,
        progressTone: 'indigo' as const,
        title: 'UI/UX Design in the age of AI',
      },
      {
        avatars: faces(4, 2),
        badge: 'Neutro',
        checkCount: 115,
        commentCount: 32,
        overflow: 3,
        progress: 0,
        progressTone: 'indigo' as const,
        title: 'Responsive Website Design for 23 more clients',
      },
      {
        avatars: faces(2, 2),
        badge: 'OK',
        badgeTone: 'soft-amber' as const,
        checkCount: '21,8k',
        commentCount: 987,
        progress: 0,
        progressTone: 'indigo' as const,
        title: 'Blog Copywriting (Low priority 😅)',
      },
      {
        avatars: faces(2),
        badge: 'Não tão importante',
        badgeTone: 'soft-rose' as const,
        checkCount: 11,
        commentCount: 5,
        progress: 0,
        progressTone: 'indigo' as const,
        title: 'Landing page for Azunyan senpai',
      },
    ],
    count: 8,
    dotColor: '#4f46e5',
    title: 'A fazer',
  },
  {
    cards: [
      {
        avatars: faces(2),
        badge: 'Importante',
        checkCount: 187,
        commentCount: 11,
        progress: 52,
        progressTone: 'amber' as const,
        title: 'Machine Learning Progress',
      },
      {
        avatars: faces(2, 1),
        badge: 'Neutro',
        checkCount: 115,
        commentCount: 32,
        progress: 30,
        progressTone: 'amber' as const,
        title: 'Learn Computer Science',
      },
    ],
    count: 2,
    dotColor: '#f59e0b',
    title: 'Em progresso',
  },
  {
    cards: [
      {
        avatars: faces(2, 1),
        badge: 'Importante',
        checkCount: '2.2K',
        commentCount: 11,
        progress: 100,
        progressLabel: 'Feito',
        progressTone: 'green' as const,
        title: 'User flow confirmation for fintech App',
      },
      {
        avatars: faces(3, 2),
        badge: 'Prioridade alta',
        badgeTone: 'soft-rose' as const,
        checkCount: 87,
        commentCount: 1,
        progress: 100,
        progressLabel: 'Feito',
        progressTone: 'green' as const,
        title: 'Do some usual chores',
      },
      {
        avatars: faces(2, 3),
        badge: 'OK',
        badgeTone: 'soft-amber' as const,
        checkCount: '21,8k',
        commentCount: 987,
        progress: 100,
        progressLabel: 'Feito',
        progressTone: 'green' as const,
        title: 'Write a few articles for slothUI',
      },
      {
        avatars: faces(4),
        badge: 'OK',
        badgeTone: 'soft-amber' as const,
        checkCount: '21,8k',
        commentCount: 987,
        overflow: 3,
        progress: 100,
        progressLabel: 'Feito',
        progressTone: 'green' as const,
        title: 'Transform into a cyborg',
      },
      {
        avatars: faces(1, 4),
        badge: 'Não tão importante',
        badgeTone: 'soft-rose' as const,
        checkCount: 11,
        commentCount: 5,
        progress: 100,
        progressLabel: 'Feito',
        progressTone: 'green' as const,
        title: 'Design 100 landing page for client',
      },
    ],
    count: 7,
    dotColor: '#00c345',
    title: 'Concluído',
  },
];

const viewTabs = [
  { icon: <GridIcon className="size-5" />, id: 'grid', label: 'Visualização em grade' },
  { icon: <ListIcon className="size-5" />, id: 'list', label: 'Visualização em lista' },
  { icon: <ColumnsIcon className="size-5" />, id: 'columns', label: 'Visualização em colunas' },
  { icon: <RowsIcon className="size-5" />, id: 'rows', label: 'Visualização em linhas' },
];

export function KanbanProjectBoard() {
  const narrow = useNarrowScreen();

  return (
    <KanbanScope className={narrow ? 'bg-white text-[#1e293b]' : 'flex min-h-[960px] bg-white text-[#1e293b]'}>
      <KanbanAppSidebar variant={narrow ? 'mobile' : 'slim'} />
      <div className="min-w-0 flex-1">
        <div className={narrow ? 'px-4 pt-6' : 'flex items-center justify-between px-8 pt-5'}>
          {narrow ? null : (
            <KanbanBreadcrumb
              items={[
                { label: 'Painel' },
                { label: 'Projeto' },
                { current: true, icon: <SphereIcon className="size-5" />, label: 'Project PlanetX' },
              ]}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <KanbanIconButton accessibleName="Buscar" variant="outline">
              <MagnifyingGlassIcon />
            </KanbanIconButton>
            <KanbanAvatarGroup people={KIT_AVATARS.slice(0, 5).map((src) => ({ src }))} />
            <KanbanButton icon={<PlusIcon className="size-5" />} variant="outline">
              Convidar
            </KanbanButton>
          </div>
        </div>
        <div className={narrow ? 'px-4 pt-6' : 'flex items-center gap-4 px-8 pt-8'}>
          <KanbanPlaceholderLogo size={narrow ? 48 : 96} />
          <div className="min-w-0 flex-1">
            <h1 className={narrow ? 'text-[32px] font-bold' : 'text-[38px] font-bold'}>Project PlanetX</h1>
          </div>
        </div>
        <div className={narrow ? 'flex flex-col gap-4 px-4 pt-6' : 'flex flex-wrap items-end justify-between gap-4 px-8 pt-6'}>
          <KanbanTabGroup appearance="segmented" label="Visualização" selectedId="list" tabs={viewTabs} />
          <div className={narrow ? 'flex flex-col items-start gap-3' : 'flex flex-col items-end gap-3'}>
            <div className="flex flex-wrap items-center gap-4">
              <KanbanButton icon={<GridIcon className="size-5" />} iconPosition="start" tone="ink" variant="text">
                Visualização em grade
              </KanbanButton>
              <KanbanButton icon={<FilterIcon className="size-5" />} iconPosition="start" tone="ink" variant="text">
                Filtrar
              </KanbanButton>
              <KanbanButton icon={<SortIcon className="size-5" />} iconPosition="start" tone="ink" variant="text">
                Ordenar
              </KanbanButton>
            </div>
            <KanbanButton icon={<UploadIcon className="size-5" />} size="lg">
              Exportar dados
            </KanbanButton>
          </div>
        </div>
        <div className={narrow ? 'flex flex-col gap-8 px-4 py-8' : 'flex gap-6 overflow-x-auto px-8 py-8'}>
          {lanes.map((lane) => (
            <section key={lane.title} className="w-full min-w-[320px] rounded-[24px] bg-[#f8fafc] p-4">
              <KanbanLaneHeader
                count={lane.count}
                dotColor={lane.dotColor}
                menu={
                  <KanbanIconButton accessibleName={lane.title}>
                    <PlusIcon className="size-6" />
                  </KanbanIconButton>
                }
                title={lane.title}
              />
              <div className="mt-4 flex flex-col gap-4">
                {lane.cards.map((card) => (
                  <KanbanTaskCard key={card.title} {...card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </KanbanScope>
  );
}
