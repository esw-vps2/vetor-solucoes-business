'use client';

import { useState } from 'react';
import { KanbanAvatar } from './kanban-avatar';
import { KanbanFeaturedCard } from './kanban-featured-card';
import { KanbanIconButton } from './kanban-icon-button';
import { KanbanInputText } from './kanban-input-text';
import { KanbanLogo } from './kanban-logo';
import { KanbanLogomark } from './kanban-logomark';
import { KanbanSidebarItem } from './kanban-sidebar-item';
import { KIT_AVATARS } from './samples';
import { BellSimpleIcon } from './icons/bell-simple';
import { CalendarBlankIcon } from './icons/calendar-blank';
import { ChartBarIcon } from './icons/chart-bar';
import { ChatTeardropDotsIcon } from './icons/chat-teardrop-dots';
import { CreditCardIcon } from './icons/credit-card';
import { CubeIcon } from './icons/cube';
import { GearSixIcon } from './icons/gear-six';
import { HouseSimpleIcon } from './icons/house-simple';
import { LightningIcon } from './icons/lightning';
import { ListBulletsIcon } from './icons/list-bullets';
import { ListIcon } from './icons/list';
import { SignOutIcon } from './icons/sign-out';
import { UserIcon } from './icons/user';
import { UsersIcon } from './icons/users';

const nav = [
  { badge: '10', icon: <HouseSimpleIcon />, label: 'Início' },
  { icon: <ListBulletsIcon />, label: 'Tarefas' },
  { badge: '2', icon: <UsersIcon />, label: 'Usuários' },
  { icon: <CubeIcon />, label: 'APIs' },
  { icon: <CreditCardIcon />, label: 'Assinatura' },
  { icon: <GearSixIcon />, label: 'Configurações' },
  { icon: <ChatTeardropDotsIcon />, label: 'Ajuda e suporte' },
];

const slim = [
  { icon: <HouseSimpleIcon />, name: 'Início', selected: true },
  { icon: <ChartBarIcon />, name: 'Gráfico' },
  { icon: <UserIcon />, name: 'Pessoa' },
  { icon: <CalendarBlankIcon />, name: 'Calendário' },
  { icon: <LightningIcon />, name: 'Raio' },
  { icon: <BellSimpleIcon />, name: 'Avisos' },
];

export function KanbanAppSidebar({ variant = 'default' }: { variant?: 'default' | 'slim' | 'mobile' }) {
  const [query, setQuery] = useState('');

  if (variant === 'mobile') {
    return (
      <header className="flex h-16 w-full items-center gap-2.5 border-b border-[#e2e8f0] bg-white px-4 py-3">
        <div className="flex-1">
          <KanbanLogo />
        </div>
        <KanbanIconButton accessibleName="Menu">
          <ListIcon />
        </KanbanIconButton>
      </header>
    );
  }

  if (variant === 'slim') {
    return (
      <aside className="flex h-full w-20 flex-col items-center justify-between border-r border-[#e2e8f0] bg-white px-4 py-6">
        <div className="flex flex-col items-center gap-8">
          <KanbanLogomark />
          <div className="flex flex-col gap-4">
            {slim.map((item) => (
              <KanbanIconButton
                key={item.name}
                accessibleName={item.name}
                variant={item.selected ? 'selected' : 'ghost'}
              >
                {item.icon}
              </KanbanIconButton>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <KanbanIconButton accessibleName="Configurações">
            <GearSixIcon />
          </KanbanIconButton>
          <KanbanAvatar alt="" size="lg" src={KIT_AVATARS[1]} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[312px] flex-col justify-between border-r border-[#e2e8f0] bg-white px-4 py-8">
      <div className="flex flex-col gap-8">
        <KanbanLogo />
        <KanbanInputText value={query} onChange={setQuery} />
        <div className="flex flex-col gap-2">
          {nav.map((item) => (
            <KanbanSidebarItem key={item.label} badge={item.badge} icon={item.icon} label={item.label} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <KanbanFeaturedCard />
        <div className="flex items-end gap-4 border-t border-[#e2e8f0] pt-6">
          <KanbanAvatar alt="" src={KIT_AVATARS[0]} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-[#1e293b]">Azunyan U. Wu</p>
            <p className="text-sm font-medium text-[#475569]">Membro básico</p>
          </div>
          <KanbanIconButton accessibleName="Sair">
            <SignOutIcon />
          </KanbanIconButton>
        </div>
      </div>
    </aside>
  );
}
