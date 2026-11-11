'use client';

import { useState } from 'react';
import { KanbanAppSidebar } from './kanban-app-sidebar';
import { KanbanAvatarGroup } from './kanban-avatar-group';
import { KanbanButton } from './kanban-button';
import { KanbanInputText } from './kanban-input-text';
import { KanbanLaneHeader } from './kanban-lane-header';
import { KanbanLaunchCard } from './kanban-launch-card';
import { KanbanPlaceholderLogo } from './kanban-placeholder-logo';
import { KanbanScope } from './kanban-scope';
import { KanbanTabGroup } from './kanban-tab-group';
import { KIT_AVATARS, KIT_COVER_FINTECH, KIT_COVER_LENS, KIT_COVER_STEPS } from './samples';
import { CalendarBlankIcon } from './icons/calendar-blank';
import { CaretDownIcon } from './icons/caret-down';
import { CheckIcon } from './icons/check';
import { ColumnsIcon } from './icons/columns';
import { HourglassSimpleIcon } from './icons/hourglass-simple';
import { ListIcon } from './icons/list';
import { ShareNetworkIcon } from './icons/share-network';
import { useNarrowScreen } from './use-narrow-screen';

const lanes = ['Novos pedidos', 'Atribuído', 'Em progresso', 'Aprovado'];

const newRequestCards = [
  {
    badges: [
      { label: 'Iniciado', tone: 'solid-indigo' as const },
      { label: 'P2', tone: 'solid-rose' as const },
    ],
    coverSrc: KIT_COVER_FINTECH,
    dateLabel: 'Dec  2 -  8',
    thumbsUp: 2,
    title: 'New user templates for a fintech app (High Priority)',
  },
  {
    badges: [
      { label: 'Iniciado', tone: 'solid-indigo' as const },
      { label: 'P1', tone: 'solid-amber' as const },
    ],
    title: 'Mobile App Wireframes',
  },
  {
    badges: [
      { label: 'Iniciado', tone: 'solid-indigo' as const },
      { label: 'P1', tone: 'solid-amber' as const },
    ],
    title: 'New Pricing System Update',
  },
];

const approvedCards = [
  {
    badges: [
      { label: 'Concluído', tone: 'solid-indigo' as const },
      { label: 'P2', tone: 'solid-rose' as const },
    ],
    title: 'Mobile Notifications',
  },
  {
    badges: [
      { label: 'Concluído', tone: 'solid-indigo' as const },
      { label: 'P2', tone: 'solid-amber' as const },
    ],
    title: 'Localization & Linearization',
  },
  {
    badges: [
      { label: 'Concluído', tone: 'solid-indigo' as const },
      { label: 'P1', tone: 'solid-slate' as const },
    ],
    title: 'Distributed Systems',
  },
  {
    badges: [
      { label: 'Concluído', tone: 'solid-indigo' as const },
      { label: 'P1', tone: 'solid-rose' as const },
    ],
    title: 'Kubernetes Maintenance',
  },
  {
    badges: [
      { label: 'Concluído', tone: 'solid-indigo' as const },
      { label: 'P3', tone: 'solid-indigo' as const },
    ],
    title: 'New Product environment',
  },
  {
    badges: [
      { label: 'Concluído', tone: 'solid-indigo' as const },
      { label: 'P3', tone: 'solid-amber' as const },
    ],
    title: 'Accessibility Updates',
  },
];

export function KanbanLaunchBoard() {
  const narrow = useNarrowScreen();
  const [query, setQuery] = useState('');

  return (
    <KanbanScope className={narrow ? 'bg-white text-[#1e293b]' : 'flex min-h-[960px] bg-white text-[#1e293b]'}>
      <KanbanAppSidebar variant={narrow ? 'mobile' : 'slim'} />
      <div className="min-w-0 flex-1">
        <div className={narrow ? 'px-4 pt-6' : 'px-8 pt-8'}>
          <div className="flex items-center gap-4">
            <KanbanPlaceholderLogo size={48} />
            <h1 className={`inline-flex items-center gap-2 font-bold ${narrow ? 'text-[32px]' : 'text-[38px]'}`}>
              Lançamento do site 2024
              <CaretDownIcon className="size-6" />
            </h1>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="w-full max-w-sm">
              <KanbanInputText placeholder="Buscar tarefas..." value={query} onChange={setQuery} />
            </div>
            <KanbanButton icon={<ShareNetworkIcon className="size-5" />}>Compartilhar</KanbanButton>
            <KanbanAvatarGroup people={KIT_AVATARS.slice(0, 3).map((src) => ({ src }))} overflow={3} />
            <KanbanButton icon={<CaretDownIcon className="size-5" />} tone="ink" variant="text">
              Público para todos
            </KanbanButton>
          </div>
          <div className="mt-4">
            <KanbanTabGroup
              label="Lançamento"
              tabs={[
                { icon: <ListIcon className="size-5" />, id: 'list', label: 'Lista' },
                { icon: <ColumnsIcon className="size-5" />, id: 'board', label: 'Quadro' },
                { icon: <HourglassSimpleIcon className="size-5" />, id: 'timeline', label: 'Linha do tempo' },
                { icon: <CalendarBlankIcon className="size-5" />, id: 'calendar', label: 'Calendário' },
                { icon: <CheckIcon className="size-5" />, id: 'progress', label: 'Progresso' },
              ]}
            />
          </div>
        </div>
        <div className={narrow ? 'flex flex-col gap-8 px-4 py-8' : 'flex gap-6 overflow-x-auto px-8 py-8'}>
          {lanes.map((title, index) => (
            <section key={title} className="w-full min-w-[280px]">
              <KanbanLaneHeader title={title} variant="launch" />
              <div className="mt-4 flex flex-col gap-4">
                {index === 0
                  ? newRequestCards.map((card) => (
                      <KanbanLaunchCard
                        key={card.title}
                        assignee={{ src: KIT_AVATARS[0] }}
                        badges={card.badges}
                        coverSrc={card.coverSrc}
                        dateLabel={card.dateLabel}
                        thumbsUp={card.thumbsUp}
                        title={card.title}
                      />
                    ))
                  : null}
                {index === 3
                  ? approvedCards.map((card) => (
                      <KanbanLaunchCard key={card.title} badges={card.badges} title={card.title} />
                    ))
                  : null}
                {index === 1 ? (
                  <>
                    <KanbanLaunchCard
                      assignee={{ src: KIT_AVATARS[3] }}
                      badges={[{ label: 'Em andamento', tone: 'solid-indigo' }]}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={7}
                      title="Backend enhancements and performance improvements"
                    />
                    <KanbanLaunchCard
                      assignee={{ src: KIT_AVATARS[4] }}
                      badges={[{ label: 'Não iniciado', tone: 'solid-slate' }]}
                      commentCount={88}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={2}
                      title="Customer Reporting"
                    />
                    <KanbanLaunchCard
                      assignee={{ src: KIT_AVATARS[1] }}
                      badges={[{ label: 'Iniciado', tone: 'solid-indigo' }]}
                      commentCount={1}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={2}
                      title="Offline Mode Functionality"
                    />
                    <KanbanLaunchCard
                      assignee={{ src: KIT_AVATARS[2] }}
                      badges={[{ label: 'Não iniciado', tone: 'solid-slate' }]}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={11}
                      title="User Community Launch Enhancements"
                    />
                  </>
                ) : null}
                {index === 2 ? (
                  <>
                    <KanbanLaunchCard
                      badges={[
                        { label: 'Em progresso', tone: 'solid-indigo' },
                        { label: 'P2', tone: 'solid-rose' },
                      ]}
                      commentCount={97}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={668}
                      title="Upgrade and payment options"
                    />
                    <KanbanLaunchCard
                      assignee={{ src: KIT_AVATARS[2] }}
                      badges={[{ label: 'Não iniciado', tone: 'solid-slate' }]}
                      coverSrc={KIT_COVER_LENS}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={2}
                      title="In-product education"
                    />
                    <KanbanLaunchCard
                      badges={[
                        { label: 'Em progresso', tone: 'solid-indigo' },
                        { label: 'P3', tone: 'solid-green' },
                      ]}
                      commentCount={34}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={88}
                      title="App design refresh"
                    />
                    <KanbanLaunchCard
                      assignee={{ src: KIT_AVATARS[4] }}
                      badges={[
                        { label: 'Não iniciado', tone: 'solid-slate' },
                        { label: 'P1', tone: 'soft-green' },
                      ]}
                      coverSrc={KIT_COVER_STEPS}
                      dateLabel="Dec  2 -  8"
                      thumbsUp={3}
                      title="Linux version update"
                    />
                  </>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </KanbanScope>
  );
}
