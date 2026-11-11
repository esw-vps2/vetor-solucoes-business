import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/client';
import { ProjectBoardView } from './project-board';

const { reducedMotionState } = vi.hoisted(() => ({
  reducedMotionState: { current: false },
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotionState.current,
  };
});

const actor: api.SafeUser = {
  age: 32,
  email: 'ana@example.com',
  enabledActions: ['viewProjects', 'moveCards'],
  firstName: 'Ana',
  id: 'user-id',
  lastName: 'Silva',
  photoUrl: '/api/v1/users/user-id/photo',
  profile: 'Usuario',
  sex: 'F',
  tenantId: 'tenant-id',
  tenantName: 'Acme',
  tenantSlug: 'acme',
};

const attachment: api.CardAttachment = {
  byteSize: 1024,
  cardId: 'card-1',
  contentType: 'image/jpeg',
  createdByFirstName: 'Ana',
  createdByLastName: 'Silva',
  createdByUserId: 'user-id',
  id: 'att-1',
  originalName: 'cover.jpg',
  url: '/api/v1/cards/card-1/attachments/att-1',
};

const card: api.ProjectCard = {
  assigneeFirstName: 'Ana',
  assigneeLastName: 'Silva',
  assigneePhotoUrl: '/api/v1/users/user-id/photo',
  assigneeUserId: 'user-id',
  attachments: [attachment],
  checklistItems: [
    {
      body: 'Write the specification',
      cardId: 'card-1',
      createdByUserId: 'user-id',
      done: true,
      id: 'check-1',
      position: 0,
    },
    {
      body: 'Build the board',
      cardId: 'card-1',
      createdByUserId: 'user-id',
      done: false,
      id: 'check-2',
      position: 1,
    },
  ],
  comments: [
    {
      authorFirstName: 'Ana',
      authorLastName: 'Silva',
      authorUserId: 'user-id',
      body: 'Ready',
      cardId: 'card-1',
      createdAt: '2026-09-21T12:00:00.000Z',
      id: 'comment-1',
      updatedAt: '2026-09-21T12:00:00.000Z',
    },
  ],
  coverAttachmentId: 'att-1',
  createdAt: '2026-09-20T15:00:00.000Z',
  createdByFirstName: 'Ana',
  createdByLastName: 'Silva',
  createdByUserId: 'user-id',
  description: 'Implement the board',
  dueAt: '2026-09-21T03:00:00.000Z',
  startsAt: '2026-09-20T03:00:00.000Z',
  id: 'card-1',
  lane: 'backlog',
  number: 1,
  position: 0,
  priority: 'high',
  projectId: 'proj-1',
  tags: [{ color: 'lime', name: 'portal' }],
  title: 'Build the board',
};

function boardWith(cards: api.ProjectCard[]): api.ProjectBoard {
  return {
    backgroundUrl: null,
    documents: [],
    id: 'proj-1',
    kanbanFilters: null,
    lanes: [
      { cards, key: 'backlog' },
      { cards: [], key: 'ready' },
      { cards: [], key: 'working' },
      { cards: [], key: 'review' },
      { cards: [], key: 'deploy' },
      { cards: [], key: 'done' },
    ],
    name: 'Portal Kanban',
    tenantId: 'tenant-id',
    workspaceId: 'ws-1',
  };
}

describe('ProjectBoardView', () => {
  beforeEach(() => {
    reducedMotionState.current = false;
    window.history.replaceState(null, '', '/portal/projetos/proj-1');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders six colorful lanes, rounded cards, and face metadata without lane move controls', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: actor.email,
        enabledActions: ['viewProjects', 'moveCards'],
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: 'Usuario',
        status: 'active',
        tenantId: actor.tenantId,
        tenantName: actor.tenantName,
        tenantSlug: actor.tenantSlug,
      },
    ]);

    const { container } = render(<ProjectBoardView projectId="proj-1" user={actor} />);

    expect(await screen.findByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pronto' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trabalhando' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Revisão' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Deploy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Finalizado' })).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.queryByText('portal')).not.toBeInTheDocument();
    expect(screen.queryByText('1/2')).not.toBeInTheDocument();
    expect(screen.getByText('Alta').className).toContain('text-[#ef4444]');
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    const face = article as HTMLElement;
    expect(within(face).getByText('#1').className).toContain('text-base');
    expect(within(face).getByText('#1').className).toContain('text-[#1e293b]');
    expect(within(face).getByText('Build the board').className).toContain('text-base');
    expect(within(face).getByText('#1').parentElement).toBe(
      within(face).getByText('Build the board').parentElement,
    );
    expect(within(face).queryByText('Implement the board')).not.toBeInTheDocument();
    expect(within(face).queryByText('Tags:')).not.toBeInTheDocument();
    expect(within(face).queryByText('Checklist:')).not.toBeInTheDocument();
    expect(within(face).getByText('Anexos:')).toBeInTheDocument();
    expect(within(face).getByText('Data e hora:')).toBeInTheDocument();
    expect(within(face).getByText('Comentários:').parentElement?.parentElement).toBe(
      within(face).getByText('Anexos:').parentElement?.parentElement,
    );
    expect(within(face).getByText('Anexos:').parentElement?.parentElement).toBe(
      within(face).getByText('Prioridade:').parentElement?.parentElement,
    );
    expect(within(face).getByText('Prioridade:')).toBeInTheDocument();
    expect(within(face).getByText('Associado:')).toBeInTheDocument();
    expect(within(face).getByRole('button', { name: 'Editar' }).className).toContain('bg-accent');
    expect(within(face).getByRole('button', { name: 'Editar' }).className).toContain('min-h-10');
    expect(within(face).getByRole('button', { name: 'Excluir' }).parentElement).toBe(
      within(face).getByRole('button', { name: 'Compartilhar' }).parentElement,
    );
    expect(within(face).getByRole('button', { name: 'Compartilhar' }).className).toContain(
      'border-[#cbd5e1]',
    );
    expect(within(face).getByRole('button', { name: 'Compartilhar' }).className).toContain(
      'text-[#1e293b]',
    );
    expect(container.querySelector('.overflow-x-auto')).not.toBeNull();
    expect(container.querySelector('.overflow-y-auto.touch-pan-y')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Novo card' }).className).toContain('min-h-10');
    expect(container.querySelector('.rounded-\\[24px\\]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Backlog' }).parentElement).toHaveClass(
      'rounded-full',
    );
    expect(container.querySelector('.bg-\\[\\#eef2ff\\]')).toBeNull();
    expect(container.querySelector('.text-\\[\\#ef4444\\]')).not.toBeNull();
    expect(
      container.querySelector('.bg-board-due-overdue, .bg-board-due-today, .bg-board-due-future'),
    ).not.toBeNull();
    expect(container.querySelector('[data-entrance="stagger"]')).not.toBeNull();
    expect(container.querySelector('.board-canvas-default')).toBeNull();
    expect(container.querySelector('[class*="bg-navy/40"]')).toBeNull();
    expect(container.querySelector('.board-lane-raised')).toBeNull();
    expect(container.querySelector('.kanban-ui.font-plus-jakarta-sans')).not.toBeNull();
    expect(container.querySelector('img[src*="cover.jpg"], img[src*="att-1"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Novo card' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Arquivos do projeto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subir' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Descer' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mover')).not.toBeInTheDocument();
    const openCard = face.querySelector('button');
    expect(openCard?.textContent).toContain('#1');
    expect(openCard?.textContent).toContain('Build the board');
    expect(container.querySelector('[draggable="true"]')).not.toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Trello')).not.toBeInTheDocument();
  });

  it('colors priority text blue, yellow, and red', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(
      boardWith([
        { ...card, id: 'card-low', number: 2, priority: 'low', title: 'Low card' },
        { ...card, id: 'card-mid', number: 3, priority: 'medium', title: 'Mid card' },
        card,
      ]),
    );
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    expect((await screen.findByText('Baixa')).className).toContain('text-[#3d9cf0]');
    expect(screen.getByText('Média').className).toContain('text-[#f5a524]');
    expect(screen.getByText('Alta').className).toContain('text-[#ef4444]');
  });

  it('renders a card with no assignee name or initials', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(
      boardWith([
        {
          ...card,
          assigneeFirstName: '',
          assigneeLastName: '',
          assigneePhotoUrl: null,
          assigneeUserId: null,
          attachments: [],
          title: 'Unassigned card',
        },
      ]),
    );
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    const title = await screen.findByText('Unassigned card');
    const face = title.closest('article');

    expect(face).not.toBeNull();
    expect(within(face as HTMLElement).queryByText('AS')).not.toBeInTheDocument();
    expect(within(face as HTMLElement).queryByText('Ana Silva')).not.toBeInTheDocument();
    expect(face?.querySelector('img')).toBeNull();
  });

  it('lets a manager change only empty lanes', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const update = vi.spyOn(api, 'updateProjectKanbanLanes').mockResolvedValue({
      id: 'proj-1',
      name: 'Portal Kanban',
      workspaceId: 'ws-1',
    } as api.ProjectSummary);
    render(<ProjectBoardView projectId="proj-1" user={{ ...actor, profile: 'Administrador' }} />);

    const backlog = (await screen.findByRole('heading', { name: 'Backlog' })).closest('section');
    expect(
      within(backlog as HTMLElement).queryByRole('button', { name: 'Excluir raia' }),
    ).toBeNull();
    expect(within(backlog as HTMLElement).queryByRole('button', { name: 'Backlog' })).toBeNull();

    const ready = screen.getByRole('heading', { name: 'Pronto' }).closest('section') as HTMLElement;
    expect(within(ready).queryByRole('button', { name: 'Renomear' })).toBeNull();
    expect(within(ready).getByRole('button', { name: 'Excluir raia' })).toBeInTheDocument();
    fireEvent.click(within(ready).getByRole('button', { name: 'Pronto' }));
    const laneName = within(ready).getByLabelText('Nome da raia');
    fireEvent.change(laneName, { target: { value: 'Preparação' } });
    fireEvent.submit(laneName.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        'proj-1',
        expect.arrayContaining([
          expect.objectContaining({ key: 'backlog', label: 'Backlog' }),
          expect.objectContaining({ key: 'ready', label: 'Preparação' }),
        ]),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Nova raia' }));
    const newLaneName = screen.getByLabelText('Nome da raia');
    fireEvent.change(newLaneName, { target: { value: 'QA' } });
    fireEvent.click(
      within(newLaneName.closest('form') as HTMLElement).getByRole('button', { name: 'Salvar' }),
    );

    await waitFor(() => {
      expect(update).toHaveBeenLastCalledWith('proj-1', expect.arrayContaining([{ label: 'QA' }]));
    });
  });

  it('hides lane configuration from a tenant administrator until the actions are granted', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const { rerender } = render(
      <ProjectBoardView
        projectId="proj-1"
        user={{ ...actor, enabledActions: [], profile: 'AdministradorTenant' }}
      />,
    );

    const ready = (await screen.findByRole('heading', { name: 'Pronto' })).closest(
      'section',
    ) as HTMLElement;
    expect(within(ready).queryByRole('button', { name: 'Excluir raia' })).toBeNull();
    expect(within(ready).queryByRole('button', { name: 'Pronto' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nova raia' })).toBeNull();

    rerender(
      <ProjectBoardView
        projectId="proj-1"
        user={{
          ...actor,
          enabledActions: ['createLane', 'renameLane', 'deleteLane'],
          profile: 'Usuario',
        }}
      />,
    );

    const grantedReady = (await screen.findByRole('heading', { name: 'Pronto' })).closest(
      'section',
    ) as HTMLElement;
    expect(screen.getByRole('button', { name: 'Nova raia' })).toBeInTheDocument();
    expect(within(grantedReady).getByRole('button', { name: 'Pronto' })).toBeInTheDocument();
    expect(within(grantedReady).getByRole('button', { name: 'Excluir raia' })).toBeInTheDocument();
  });

  it('lets a manager drag a lane into another position', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const update = vi.spyOn(api, 'updateProjectKanbanLanes').mockResolvedValue({
      id: 'proj-1',
      name: 'Portal Kanban',
      workspaceId: 'ws-1',
    } as api.ProjectSummary);
    render(<ProjectBoardView projectId="proj-1" user={{ ...actor, profile: 'Administrador' }} />);

    const backlogHeading = await screen.findByRole('heading', { name: 'Backlog' });
    const backlogPill = backlogHeading.closest('[draggable="true"]');
    const ready = screen.getByRole('heading', { name: 'Pronto' }).closest('section');
    expect(backlogPill).not.toBeNull();
    expect(ready).not.toBeNull();
    const store = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: 'move',
      getData: (type: string) => store.get(type) ?? '',
      setData: (type: string, value: string) => {
        store.set(type, value);
      },
      types: ['text/x-kanban-lane'],
    };
    fireEvent.dragStart(backlogPill as HTMLElement, { dataTransfer });
    fireEvent.dragOver(ready as HTMLElement, { dataTransfer });
    fireEvent.drop(ready as HTMLElement, { dataTransfer });

    await waitFor(() => {
      const payload = update.mock.calls.at(-1)?.[1] as { key: string }[];
      expect(payload.map((lane) => lane.key)).toEqual([
        'ready',
        'backlog',
        'working',
        'review',
        'deploy',
        'done',
      ]);
    });
  });

  it('plays the entrance effect and skips stagger when reduced motion is set', async () => {
    reducedMotionState.current = true;
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);

    const { container } = render(<ProjectBoardView projectId="proj-1" user={actor} />);
    expect(await screen.findByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
    expect(container.querySelector('[data-entrance="static"]')).not.toBeNull();
  });

  it('hides move controls and drag without moveCards', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const { container } = render(
      <ProjectBoardView projectId="proj-1" user={{ ...actor, enabledActions: ['viewProjects'] }} />,
    );

    expect(await screen.findByRole('button', { name: 'Novo card' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subir' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mover')).not.toBeInTheDocument();
    expect(container.querySelector('[draggable="true"]')).toBeNull();
  });

  it('shows comments, checklist, uploader, delete confirmation, and rejects an invalid file', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    const face = (await screen.findByText('#1')).closest('article') as HTMLElement;
    fireEvent.click(within(face).getByRole('button', { name: /Build the board/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Build the board' })).toBeInTheDocument();
    const number = within(dialog).getByText('#1');
    expect(number.className).toContain('text-xl');
    expect(number.closest('div')?.textContent).toContain('Build the board');
    expect(within(dialog).getByRole('heading', { name: 'Solicitação' })).toBeInTheDocument();
    expect(within(dialog).getByText('Implement the board')).toBeInTheDocument();
    expect(within(dialog).getByText('20/09/2026, 12:00')).toBeInTheDocument();
    expect(within(dialog).getByText('Criado:')).toBeInTheDocument();
    expect(within(dialog).getByText('Associado:')).toBeInTheDocument();
    expect(within(dialog).getByText('Data início:')).toBeInTheDocument();
    expect(within(dialog).getByText('Data fim:')).toBeInTheDocument();
    expect(within(dialog).getByText('20/09/2026, 00:00')).toBeInTheDocument();
    expect(within(dialog).getByText('21/09/2026, 00:00')).toBeInTheDocument();
    expect(within(dialog).getByText('Prioridade:')).toBeInTheDocument();
    expect(within(dialog).queryByText('Tags:')).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/Creator/)).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole('button', { name: 'Editar' })[0].className).toContain(
      'bg-accent',
    );
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Editar' })[0]);
    expect(within(dialog).getByLabelText('Título')).toBeInTheDocument();
    expect(within(dialog).queryByText('Tags')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' }).className).toContain(
      'bg-accent',
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    const checklistRow = within(dialog).getByText('Write the specification').closest('li');
    expect(checklistRow).not.toBeNull();
    fireEvent.click(within(checklistRow as HTMLElement).getByRole('button', { name: 'Editar' }));
    const checklistInput = within(checklistRow as HTMLElement).getByRole('textbox');
    expect(checklistInput).toHaveValue('Write the specification');
    const updateItem = vi.spyOn(api, 'updateChecklistItem').mockResolvedValue({
      body: 'Write the spec',
      cardId: 'card-1',
      createdByUserId: 'user-id',
      done: true,
      id: 'check-1',
      position: 0,
    });
    fireEvent.change(checklistInput, { target: { value: 'Write the spec' } });
    fireEvent.click(within(checklistRow as HTMLElement).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith('card-1', 'check-1', { body: 'Write the spec' });
    });
    expect(within(dialog).getAllByRole('button', { name: 'Editar' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('21/09/2026, 09:00')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comentários' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comentar' })).toBeInTheDocument();
    expect(screen.getByText('Checklist')).toBeInTheDocument();
    expect(screen.getByText('Write the specification')).toBeInTheDocument();
    expect(screen.getByText('Enviado por Ana Silva')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo item' })).toBeInTheDocument();
    expect(within(dialog).queryByText('Capa')).not.toBeInTheDocument();
    expect(screen.getByText('Anexos')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);
    expect(screen.getByText('Excluir este card?')).toBeInTheDocument();

    const fileInput = within(dialog).getByLabelText('Enviar arquivo');
    expect(fileInput).toHaveClass('sr-only');
    expect(fileInput).toHaveAttribute('multiple');
    expect(within(dialog).getByText('Cada arquivo até 5 MB.')).toBeInTheDocument();
    fireEvent.change(fileInput, {
      target: { files: [new File(['<svg />'], 'icon.svg', { type: 'image/svg+xml' })] },
    });
    expect(await screen.findByText('Envie um arquivo permitido de até 5 MB.')).toBeInTheDocument();

    const saveButtons = within(dialog).getAllByRole('button', { name: 'Salvar' });
    fireEvent.click(saveButtons[saveButtons.length - 1]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uploads several allowed card files from one picker', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const add = vi.spyOn(api, 'addCardAttachment').mockResolvedValue(attachment);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    const face = (await screen.findByText('#1')).closest('article') as HTMLElement;
    fireEvent.click(within(face).getByRole('button', { name: /Build the board/ }));
    const notes = new File(['ok'], 'notes.txt', { type: 'text/plain' });
    const pdf = new File(['ok'], 'spec.pdf', { type: 'application/pdf' });
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('Enviar arquivo'), {
      target: { files: [notes, pdf] },
    });

    await waitFor(() => {
      expect(add).toHaveBeenCalledTimes(2);
    });
    expect(add).toHaveBeenNthCalledWith(1, 'card-1', notes);
    expect(add).toHaveBeenNthCalledWith(2, 'card-1', pdf);
  });

  it('creates a card from Novo card', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: actor.email,
        enabledActions: ['viewProjects'],
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: 'Usuario',
        status: 'active',
        tenantId: actor.tenantId,
        tenantName: actor.tenantName,
        tenantSlug: actor.tenantSlug,
      },
    ]);
    const create = vi.spyOn(api, 'createProjectCard').mockResolvedValue(card);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Novo card' }));
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog').className).toContain('bg-white');
    expect(screen.getByRole('dialog').className).not.toContain('bg-navy-50');
    expect(screen.queryByRole('button', { name: 'Fechar janela' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Prioridade').parentElement?.nextElementSibling).toContainElement(
      screen.getByLabelText('Anexar'),
    );
    expect(screen.getByLabelText('Associado')).toBeRequired();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Build the board' } });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Implement the board' },
    });
    fireEvent.change(screen.getByLabelText('Associado'), { target: { value: 'user-id' } });
    const notes = new File(['ok'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Anexar'), { target: { files: [notes] } });
    fireEvent.change(screen.getByLabelText('Checklist'), { target: { value: 'Write the spec' } });
    fireEvent.click(screen.getByRole('button', { name: 'Novo item' }));
    expect(screen.getByText('Write the spec')).toBeInTheDocument();
    const attach = vi.spyOn(api, 'addCardAttachment').mockResolvedValue(attachment);
    const checklist = vi.spyOn(api, 'createChecklistItem').mockResolvedValue({
      body: 'Write the spec',
      cardId: 'card-1',
      createdByUserId: 'user-id',
      done: false,
      id: 'item-1',
      position: 0,
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[0]);

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          assigneeUserId: 'user-id',
          description: 'Implement the board',
          title: 'Build the board',
        }),
      );
    });
    await waitFor(() => {
      expect(attach).toHaveBeenCalledWith('card-1', notes);
    });
    expect(checklist).toHaveBeenCalledWith('card-1', 'Write the spec');
  });

  it('lists only valid assignees for the project tenant in Novo card', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: actor.email,
        enabledActions: ['viewProjects'],
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: 'Usuario',
        status: 'active',
        tenantId: actor.tenantId,
        tenantName: actor.tenantName,
        tenantSlug: actor.tenantSlug,
      },
      {
        email: 'other@example.com',
        enabledActions: ['viewProjects'],
        firstName: 'Other',
        id: 'other-user-id',
        lastName: 'Tenant',
        profile: 'Usuario',
        status: 'active',
        tenantId: 'other-tenant-id',
        tenantName: 'Other Co',
        tenantSlug: 'other-co',
      },
    ]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Novo card' }));
    const select = screen.getByLabelText('Associado');
    const options = within(select).getAllByRole('option');

    expect(options).toHaveLength(2);
    expect(options[1]).toHaveTextContent('Ana Silva');
    expect(within(select).queryByText('Other Tenant')).not.toBeInTheDocument();
  });

  it('omits users without Projetos access from the Associado picker', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: actor.email,
        enabledActions: ['viewProjects'],
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: 'Usuario',
        status: 'active',
        tenantId: actor.tenantId,
        tenantName: actor.tenantName,
        tenantSlug: actor.tenantSlug,
      },
      {
        email: 'finance@example.com',
        enabledActions: ['painel'],
        firstName: 'Finance',
        id: 'finance-id',
        lastName: 'Only',
        profile: 'Usuario',
        status: 'active',
        tenantId: actor.tenantId,
        tenantName: actor.tenantName,
        tenantSlug: actor.tenantSlug,
      },
    ]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Novo card' }));
    const select = screen.getByLabelText('Associado');
    const options = within(select).getAllByRole('option');

    expect(options).toHaveLength(2);
    expect(within(select).queryByText('Finance Only')).not.toBeInTheDocument();
  });

  it('opens the new-card dialog from Editar and updates the card', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      {
        email: actor.email,
        enabledActions: ['viewProjects'],
        firstName: actor.firstName,
        id: actor.id,
        lastName: actor.lastName,
        profile: 'Usuario',
        status: 'active',
        tenantId: actor.tenantId,
        tenantName: actor.tenantName,
        tenantSlug: actor.tenantSlug,
      },
    ]);
    const update = vi.spyOn(api, 'updateProjectCard').mockResolvedValue(card);
    const removeItem = vi.spyOn(api, 'deleteChecklistItem').mockResolvedValue();
    const createItem = vi.spyOn(api, 'createChecklistItem').mockResolvedValue({
      body: 'Ship it',
      cardId: 'card-1',
      createdByUserId: 'user-id',
      done: false,
      id: 'check-3',
      position: 2,
    });
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('bg-white');
    expect(dialog.className).not.toContain('bg-navy-50');
    expect(within(dialog).queryByRole('button', { name: 'Fechar janela' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Editar' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Título')).toHaveValue('Build the board');
    expect(within(dialog).getByLabelText('Descrição')).toHaveValue('Implement the board');
    expect(within(dialog).getByText('Write the specification')).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Excluir' })[0]);
    fireEvent.change(within(dialog).getByLabelText('Checklist'), { target: { value: 'Ship it' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Novo item' }));
    fireEvent.change(within(dialog).getByLabelText('Título'), {
      target: { value: 'Refresh the board' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        'card-1',
        expect.objectContaining({
          description: 'Implement the board',
          title: 'Refresh the board',
        }),
      );
    });
    expect(removeItem).toHaveBeenCalledWith('card-1', 'check-1');
    expect(createItem).toHaveBeenCalledWith('card-1', 'Ship it');
  });

  it('places a dragged card without a default canvas fill', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const place = vi.spyOn(api, 'placeProjectCard').mockResolvedValue({
      ...card,
      lane: 'ready',
    });
    const { container } = render(<ProjectBoardView projectId="proj-1" user={actor} />);
    expect(await screen.findByRole('heading', { name: 'Pronto' })).toBeInTheDocument();
    expect(container.querySelector('.board-canvas-default')).toBeNull();
    const ready = screen.getByRole('heading', { name: 'Pronto' }).closest('section');
    const article = container.querySelector('[draggable="true"]');
    expect(ready).not.toBeNull();
    expect(article).not.toBeNull();
    const dataTransfer = {
      dropEffect: 'move',
      effectAllowed: 'move',
      getData: () => 'card-1',
      setData: vi.fn(),
    };
    fireEvent.dragStart(article as HTMLElement, { dataTransfer });
    fireEvent.drop(ready as HTMLElement, { dataTransfer });
    await waitFor(() => {
      expect(place).toHaveBeenCalledWith('card-1', 'ready', 0);
    });
  });

  it('shows Fundo do board only to AdministradorTenant', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const { rerender } = render(<ProjectBoardView projectId="proj-1" user={actor} />);
    expect(await screen.findByRole('button', { name: 'Arquivos do projeto' })).toBeInTheDocument();
    expect(screen.queryByText('Fundo do board')).not.toBeInTheDocument();

    rerender(
      <ProjectBoardView
        projectId="proj-1"
        user={{ ...actor, profile: 'AdministradorTenant', enabledActions: [] }}
      />,
    );
    expect(await screen.findByText('Fundo do board')).toBeInTheDocument();
  });

  it('opens the project files panel without leaving the board', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue({
      ...boardWith([]),
      documents: [
        {
          byteSize: 0,
          children: [
            {
              byteSize: 5,
              children: [],
              contentType: 'text/plain',
              createdByFirstName: 'Ana',
              createdByLastName: 'Silva',
              createdByUserId: 'user-id',
              id: 'file-1',
              kind: 'file',
              originalName: 'notes.txt',
              parentId: 'folder-1',
              projectId: 'proj-1',
              url: '/api/v1/projects/proj-1/documents/file-1',
            },
          ],
          contentType: null,
          createdByFirstName: 'Ana',
          createdByLastName: 'Silva',
          createdByUserId: 'user-id',
          id: 'folder-1',
          kind: 'folder',
          originalName: 'Docs',
          parentId: null,
          projectId: 'proj-1',
          url: null,
        },
      ],
    });
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Arquivos do projeto' }));
    expect(screen.getAllByText('Docs').length).toBeGreaterThan(0);
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Baixar pasta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Baixar' })).toBeInTheDocument();
    expect(screen.queryByText('Mover')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Visualizar' }));
    expect(
      screen.getByText(
        'Este arquivo não está habilitado para visualização. Os únicos arquivos habilitados são PDF e fotos.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByText('Renomear').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Enviado por Ana Silva').length).toBeGreaterThan(0);
    expect(screen.getByText('Enviar arquivo')).toBeInTheDocument();
    expect(screen.getByText('Enviar arquivo').className).toContain('bg-accent');
    expect(screen.getByText('Enviar arquivo')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Enviar pasta').className).not.toContain('bg-accent');
    expect(screen.getByRole('button', { name: 'Nova pasta' }).className).not.toContain('bg-accent');
    fireEvent.click(screen.getByRole('button', { name: 'Nova pasta' }));
    expect(screen.getByRole('button', { name: 'Nova pasta' }).className).toContain('bg-accent');
    expect(screen.getByText('Enviar arquivo').className).not.toContain('bg-accent');
    fireEvent.click(screen.getByText('Enviar pasta'));
    expect(screen.getByText('Enviar pasta').className).toContain('bg-accent');
    expect(screen.getByRole('button', { name: 'Nova pasta' }).className).not.toContain('bg-accent');
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);
    expect(screen.getByText('Excluir esta pasta e todo o conteúdo?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
  });

  it('opens a preview for a PDF and a photo', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['file'], { type: 'application/pdf' }),
      }),
    );
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue({
      ...boardWith([]),
      documents: [
        {
          byteSize: 8,
          children: [],
          contentType: 'application/pdf',
          createdByFirstName: 'Ana',
          createdByLastName: 'Silva',
          createdByUserId: 'user-id',
          id: 'file-pdf',
          kind: 'file',
          originalName: 'brief.pdf',
          parentId: null,
          projectId: 'proj-1',
          url: '/api/v1/projects/proj-1/documents/file-pdf',
        },
        {
          byteSize: 8,
          children: [],
          contentType: 'image/png',
          createdByFirstName: 'Ana',
          createdByLastName: 'Silva',
          createdByUserId: 'user-id',
          id: 'file-photo',
          kind: 'file',
          originalName: 'photo.png',
          parentId: null,
          projectId: 'proj-1',
          url: '/api/v1/projects/proj-1/documents/file-photo',
        },
      ],
    });
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Arquivos do projeto' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Visualizar' })[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTitle('brief.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar janela' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Visualizar' })[1]);
    expect(await screen.findByRole('img', { name: 'photo.png' })).toBeInTheDocument();
  });

  it('copies the card link from Compartilhar', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/portal/projetos/proj-1?card=card-1`,
      );
    });
    expect(screen.getByText('Link copiado.')).toBeInTheDocument();
    expect(screen.queryByText(/CC BY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/slothui/i)).not.toBeInTheDocument();
  });

  it('shows the card url when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));

    expect(await screen.findByRole('textbox', { name: 'Link do card' })).toHaveValue(
      `${window.location.origin}/portal/projetos/proj-1?card=card-1`,
    );
  });

  it('opens the card modal from the card query and clears it on close', async () => {
    window.history.replaceState(null, '', '/portal/projetos/proj-1?card=card-1');
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar janela' }));
    await waitFor(() => {
      expect(window.location.search).not.toContain('card=');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not open a modal or reveal a card id outside the loaded board', async () => {
    window.history.replaceState(null, '', '/portal/projetos/proj-1?card=other-tenant');
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    expect(await screen.findByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('other-tenant')).not.toBeInTheDocument();
  });

  it('does not open a modal when the board request is forbidden', async () => {
    window.history.replaceState(null, '', '/portal/projetos/proj-1?card=card-1');
    vi.spyOn(api, 'getProjectBoard').mockRejectedValue(new api.ApiError('forbidden', 403));
    vi.spyOn(api, 'listUsers').mockRejectedValue(new api.ApiError('forbidden', 403));
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the project title, six lane counts, filters, and dashboard actions', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    expect(await screen.findByRole('heading', { name: 'Portal Kanban' })).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Ações do board' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Colunas' })).toBeInTheDocument();
    expect(screen.getByText('Build the board')).toBeInTheDocument();
    expect(screen.queryByText('Implement the board')).not.toBeInTheDocument();
    const backlog = screen.getByRole('heading', { name: 'Backlog' }).closest('section');
    expect(backlog).not.toBeNull();
    expect(
      within(
        screen.getByRole('heading', { name: 'Backlog' }).parentElement as HTMLElement,
      ).getByText('1'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar card em Backlog' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
    expect(screen.getByLabelText('Enviar arquivo do painel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters the current view without saving when the user cannot update the project', async () => {
    const ready = { ...card, id: 'card-2', lane: 'ready', number: 2, title: 'Ship it' };
    const board = boardWith([card]);
    board.lanes = board.lanes.map((lane) =>
      lane.key === 'ready' ? { ...lane, cards: [ready] } : lane,
    );
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(board);
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const persist = vi.spyOn(api, 'updateProjectKanbanFilters').mockResolvedValue({
      id: 'proj-1',
      name: 'Portal Kanban',
      workspaceId: 'ws-1',
    });
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    expect(await screen.findByText('Ship it')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pronto' }));
    expect(screen.getByRole('button', { name: 'Pronto' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Build the board')).not.toBeInTheDocument();
    expect(screen.getByText('Ship it')).toBeInTheDocument();
    expect(persist).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Concluídas' }));
    expect(screen.queryByText('Ship it')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluídas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('persists filters for a project manager', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([card]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const persist = vi.spyOn(api, 'updateProjectKanbanFilters').mockResolvedValue({
      id: 'proj-1',
      name: 'Portal Kanban',
      workspaceId: 'ws-1',
    });
    render(
      <ProjectBoardView
        projectId="proj-1"
        user={{ ...actor, enabledActions: [], profile: 'Administrador' }}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Backlog' }));
    await waitFor(() => {
      expect(persist).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          date: null,
          status: ['backlog'],
          taskCompletion: 'all',
        }),
      );
    });
  });

  it('copies the dashboard link and uploads a project file from the header', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const upload = vi.spyOn(api, 'uploadProjectDocuments').mockResolvedValue([]);
    render(<ProjectBoardView projectId="proj-1" user={actor} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Share' }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/portal/projetos/proj-1`);
    });
    expect(screen.getByText('Link copiado.')).toBeInTheDocument();

    const notes = new File(['ok'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Enviar arquivo do painel'), {
      target: { files: [notes] },
    });
    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith('proj-1', [notes], null, ['notes.txt']);
    });
    expect(screen.getByRole('heading', { name: 'Arquivos do projeto' })).toBeInTheDocument();
  });

  it('keeps the project title visible in light and dark wrappers', async () => {
    vi.spyOn(api, 'getProjectBoard').mockResolvedValue(boardWith([]));
    vi.spyOn(api, 'listUsers').mockResolvedValue([]);
    const { rerender } = render(
      <div>
        <ProjectBoardView projectId="proj-1" user={actor} />
      </div>,
    );
    expect(await screen.findByRole('heading', { name: 'Portal Kanban' })).toBeInTheDocument();
    rerender(
      <div className="dark">
        <ProjectBoardView projectId="proj-1" user={actor} />
      </div>,
    );
    expect(screen.getByRole('heading', { name: 'Portal Kanban' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
  });
});
