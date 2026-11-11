'use client';

import { KanbanActionButton } from './kanban-action-button';
import { KanbanAppSidebar } from './kanban-app-sidebar';
import { KanbanButton } from './kanban-button';
import { KanbanIconButton } from './kanban-icon-button';
import { KanbanScope } from './kanban-scope';
import { KanbanSortControl } from './kanban-sort-control';
import { KanbanTabGroup } from './kanban-tab-group';
import { KanbanTaskCard } from './kanban-task-card';
import { KIT_AVATARS } from './samples';
import { useNarrowScreen } from './use-narrow-screen';
import { MagnifyingGlassIcon } from './icons/magnifying-glass';
import { PlusIcon } from './icons/plus';
import { ShareNetworkIcon } from './icons/share-network';
import { UploadIcon } from './icons/upload';

const task = {
  avatars: [{ src: KIT_AVATARS[0] }, { src: KIT_AVATARS[1] }],
  badge: 'Importante',
  checkCount: 187,
  commentCount: 11,
  description: 'Lorem ipsum dolor sit amet, libre unst consectetur adispicing elit.',
  title: 'UI/UX Design in the age of AI',
};

export function KanbanAnalyticsBoard() {
  const narrow = useNarrowScreen();

  const lanes = (
    <div className={narrow ? 'flex flex-col gap-8 px-4 py-8' : 'flex gap-4 overflow-x-auto px-8 py-8'}>
      <section className="flex w-full min-w-[320px] flex-col gap-4">
        <KanbanActionButton count="25" label="Em progresso" />
        <KanbanTaskCard {...task} />
        <KanbanTaskCard
          badge="Neutro"
          title="Responsive Website Design for 23 more clients"
          description={task.description}
          avatars={KIT_AVATARS.slice(2, 6).map((src) => ({ src }))}
          overflow={3}
          commentCount={32}
          checkCount={115}
          progress={0}
        />
        <KanbanTaskCard
          badge="Prioridade baixa"
          title="Blog Copywriting (Low priority 😅)"
          description={task.description}
          avatars={[{ src: KIT_AVATARS[2] }, { src: KIT_AVATARS[3] }]}
          commentCount={987}
          checkCount="21,8k"
        />
        <KanbanTaskCard
          badge="Não tão importante"
          title="Landing page for Azunyan senpai"
          description={task.description}
          avatars={[{ src: KIT_AVATARS[0] }]}
          commentCount={5}
          checkCount={11}
          progress={0}
        />
      </section>
      <section className="flex w-full min-w-[320px] flex-col gap-4">
        <KanbanActionButton count="8" label="Revisado" tone="amber" />
        <KanbanTaskCard
          badge="Importante"
          title="User flow confirmation for finance app"
          description={task.description}
          avatars={[{ src: KIT_AVATARS[1] }]}
          commentCount={8}
          checkCount={112}
        />
        <KanbanTaskCard
          badge="Importante"
          title="Healthcare app wireframe flow"
          description={task.description}
          avatars={KIT_AVATARS.slice(0, 4).map((src) => ({ src }))}
          overflow={3}
          commentCount={221}
          checkCount="87,2k"
        />
      </section>
      <section className="flex w-full min-w-[320px] flex-col gap-4">
        <KanbanActionButton count="2" label="Concluído" tone="green" />
        <KanbanTaskCard
          badge="Prioridade alta"
          title={task.title}
          description={task.description}
          avatars={[{ src: KIT_AVATARS[0] }]}
          commentCount="108k"
          checkCount={997}
        />
        <KanbanTaskCard
          badge="Prioridade baixa"
          title={task.title}
          description={task.description}
          avatars={[{ src: KIT_AVATARS[2] }, { src: KIT_AVATARS[3] }]}
          commentCount={17}
          checkCount={0}
        />
        <KanbanTaskCard
          badge="Não sei"
          badgeTone="soft-amber"
          title={task.title}
          description={task.description}
          avatars={KIT_AVATARS.slice(0, 4).map((src) => ({ src }))}
          commentCount={888}
          checkCount={12}
        />
        <KanbanTaskCard
          badge="Talvez importante"
          badgeTone="outline"
          title={task.title}
          description={task.description}
          avatars={[{ src: KIT_AVATARS[4] }]}
          commentCount={9}
          checkCount={487}
        />
        <KanbanTaskCard
          badge="Acho que"
          badgeTone="outline"
          title={task.title}
          description={task.description}
          avatars={[{ src: KIT_AVATARS[0] }, { src: KIT_AVATARS[1] }]}
          commentCount={17}
          checkCount={55}
        />
      </section>
    </div>
  );

  return (
    <KanbanScope className={narrow ? 'bg-white text-[#1e293b]' : 'flex min-h-[960px] bg-white text-[#1e293b]'}>
      <KanbanAppSidebar variant={narrow ? 'mobile' : 'default'} />
      <div className="min-w-0 flex-1">
        <div className={narrow ? 'px-4 pt-6' : 'px-8 pt-8'}>
          <div className={narrow ? 'flex flex-col gap-4' : 'flex items-center justify-between gap-4'}>
            <h1 className={narrow ? 'text-[32px] font-bold text-[#1e293b]' : 'text-[38px] font-bold text-[#1e293b]'}>
              Painel de análises
            </h1>
            <div className="flex items-center gap-2">
              <KanbanIconButton accessibleName="Buscar">
                <MagnifyingGlassIcon />
              </KanbanIconButton>
              <KanbanButton icon={<ShareNetworkIcon className="size-5" />}>Compartilhar</KanbanButton>
              <KanbanIconButton accessibleName="Enviar" variant="outline">
                <UploadIcon />
              </KanbanIconButton>
              <KanbanIconButton accessibleName="Adicionar" variant="outline">
                <PlusIcon />
              </KanbanIconButton>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 px-4">
          <KanbanTabGroup
            label="Visões"
            tabs={[
              { id: 'status', label: 'Por status' },
              { badge: '12', id: 'total', label: 'Por total de tarefas' },
              { id: 'due', label: 'Tarefas a vencer' },
              { id: 'extra', label: 'Tarefas extras' },
              { id: 'done', label: 'Tarefas concluídas' },
            ]}
          />
          <KanbanSortControl value="Mais recentes" />
        </div>
        {lanes}
      </div>
    </KanbanScope>
  );
}
