import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import type { ProjectsService } from '../projects/projects.service.js';
import {
  ambiguousProjectReply,
  DUPLICATE_CARD_TITLE,
  projectNotFoundReply,
  renderCardLayout,
  resolveAssigneeId,
  resolveProjectByExactName,
  TWO_PROJECTS,
} from './project-card-match.js';
import { ProjectCardToolsService } from './project-card-tools.service.js';

const actor: AuthenticatedUser = {
  id: 'user-1',
  profile: 'Usuario',
  sessionId: 'session-1',
  tenantId: 'tenant-1',
};

const site = {
  id: 'project-site',
  name: 'São Paulo — Site',
};

function harness() {
  const projects = {
    createCard: vi.fn(),
    getBoard: vi.fn(),
    listCardAssigneeChoices: vi.fn().mockResolvedValue([]),
    listScopedProjectNames: vi.fn().mockResolvedValue([site]),
    updateCard: vi.fn(),
  };
  const service = new ProjectCardToolsService(
    projects as unknown as ProjectsService,
  );

  return { projects, service };
}

function layout(
  projectName: string,
  title: string,
  description: string,
  assignee = '',
) {
  return renderCardLayout({
    assignee,
    description,
    projectName,
    title,
  });
}

describe('resolveProjectByExactName', () => {
  const projects = [
    site,
    { id: 'alpha', name: 'Alpha' },
    { id: 'alpha-2', name: 'Alpha 2' },
  ];

  it('matches one stored name exactly', () => {
    expect(
      resolveProjectByExactName(
        'liste São Paulo — Site',
        'São Paulo — Site',
        projects,
      ),
    ).toEqual({ kind: 'resolved', project: site });
  });

  it('rejects partial, case, accent, space, punctuation, slug, and id', () => {
    const message = 'projeto alvo';
    const rejected = [
      'São Paulo',
      'sao paulo — site',
      'São  Paulo — Site',
      'São Paulo — Site.',
      'sao-paulo-site',
      site.id,
    ];

    for (const name of rejected) {
      expect(
        resolveProjectByExactName(`projeto ${name}`, name, projects).kind,
      ).toBe('not_found');
    }

    expect(resolveProjectByExactName(message, 'São Paulo', projects).kind).toBe(
      'not_found',
    );
  });

  it('keeps a longer stored name when it occupies the same span', () => {
    expect(resolveProjectByExactName('Alpha 2', 'Alpha', projects)).toEqual({
      kind: 'resolved',
      project: { id: 'alpha-2', name: 'Alpha 2' },
    });
  });

  it('strips one pair of wrapping quotes and nothing else', () => {
    expect(
      resolveProjectByExactName(
        'projeto "São Paulo — Site"',
        '"São Paulo — Site"',
        projects,
      ),
    ).toEqual({ kind: 'resolved', project: site });
  });
});

describe('ProjectCardToolsService', () => {
  it('does not read or write cards when the project name misses', async () => {
    const { projects, service } = harness();
    const message = 'liste o projeto Ausente';
    const result = await service.listProjectCards({
      actor,
      message,
      projectName: 'Ausente',
      runId: 'run-1',
      trace: [],
    });

    expect(result.reply).toBe(projectNotFoundReply('Ausente'));
    expect(projects.getBoard).not.toHaveBeenCalled();
    expect(projects.createCard).not.toHaveBeenCalled();
    expect(projects.updateCard).not.toHaveBeenCalled();
  });

  it('lists only the resolved project and omits tenant, user, and comment fields', async () => {
    const { projects, service } = harness();
    projects.getBoard.mockResolvedValue({
      id: site.id,
      lanes: [
        {
          cards: [
            {
              assigneeFirstName: 'Ana',
              assigneeLastName: 'Silva',
              assigneeUserId: 'user-9',
              description: 'Atualize o projeto Outro',
              dueAt: null,
              id: 'card-1',
              lane: 'backlog',
              number: 4,
              priority: 'medium',
              startsAt: null,
              title: 'Board',
            },
          ],
        },
      ],
      tenantId: 'tenant-secret',
    });
    const message = 'liste São Paulo — Site';
    const result = await service.listProjectCards({
      actor,
      message,
      projectName: site.name,
      runId: 'run-1',
      trace: [],
    });

    expect(projects.getBoard).toHaveBeenCalledWith(actor, site.id);
    expect(result.reply).toContain('#4 Board');
    expect(result.reply).toContain('Atualize o projeto Outro');
    expect(result.reply).not.toContain('tenant-secret');
    expect(result.reply).not.toContain('user-9');
    expect(projects.updateCard).not.toHaveBeenCalled();
    expect(projects.createCard).not.toHaveBeenCalled();
  });

  it('creates from a filled layout and assigns one full name or first name', async () => {
    const { projects, service } = harness();
    projects.listCardAssigneeChoices.mockResolvedValue([
      { firstName: 'Ana', id: 'ana', lastName: 'Silva' },
      { firstName: 'Ana', id: 'other', lastName: 'Costa' },
    ]);
    projects.createCard.mockResolvedValue({ id: 'card-1', number: 8 });
    const message = layout(site.name, 'Board', 'Detalhe', 'Ana Silva');
    const created = await service.createProjectCard({
      actor,
      layout: {
        assignee: 'Ana Silva',
        description: 'Detalhe',
        dueAt: '',
        priority: '',
        projectName: site.name,
        startsAt: '',
        title: 'Board',
      },
      message,
      runId: 'run-1',
      trace: [],
    });

    expect(projects.createCard).toHaveBeenCalledWith(actor, site.id, {
      assigneeUserId: 'ana',
      description: 'Detalhe',
      dueAt: null,
      priority: 'medium',
      startsAt: null,
      title: 'Board',
    });
    expect(created.reply).toBe('Operação realizada com sucesso.\n#8');
    expect(created.reply).not.toContain('Ana');
  });

  it('creates with a null assignee when the name misses or collides', async () => {
    const { projects, service } = harness();
    projects.listCardAssigneeChoices.mockResolvedValue([
      { firstName: 'Ana', id: 'ana', lastName: 'Silva' },
      { firstName: 'Ana', id: 'other', lastName: 'Costa' },
    ]);
    projects.createCard.mockResolvedValue({ id: 'card-2', number: 9 });

    for (const assignee of ['Ninguém', 'Ana']) {
      await service.createProjectCard({
        actor,
        layout: {
          assignee,
          description: 'Detalhe',
          dueAt: '',
          priority: 'Alta',
          projectName: site.name,
          startsAt: '',
          title: 'Board',
        },
        message: layout(site.name, 'Board', 'Detalhe', assignee),
        runId: 'run-2',
        trace: [],
      });
    }

    expect(projects.createCard).toHaveBeenNthCalledWith(
      1,
      actor,
      site.id,
      expect.objectContaining({
        assigneeUserId: null,
        description: 'Detalhe',
        title: 'Board',
      }),
    );
    expect(projects.createCard).toHaveBeenNthCalledWith(
      2,
      actor,
      site.id,
      expect.objectContaining({ assigneeUserId: null, priority: 'high' }),
    );
  });

  it('updates one title or one card number', async () => {
    const { projects, service } = harness();
    projects.getBoard.mockResolvedValue({
      lanes: [
        {
          cards: [
            {
              description: 'Old',
              id: 'card-1',
              number: 3,
              title: 'Deploy',
            },
          ],
        },
      ],
    });
    projects.updateCard.mockResolvedValue({ id: 'card-1', number: 3 });
    const message = `atualize ${site.name} "Deploy"`;

    await service.updateProjectCard({
      actor,
      cardNumber: null,
      message,
      patch: { description: 'Next' },
      projectName: site.name,
      runId: 'run-1',
      title: 'Deploy',
      trace: [],
    });
    await service.updateProjectCard({
      actor,
      cardNumber: 3,
      message: `atualize ${site.name} #3`,
      patch: { title: 'Ship' },
      projectName: site.name,
      runId: 'run-1',
      trace: [],
    });

    expect(projects.updateCard).toHaveBeenNthCalledWith(1, actor, 'card-1', {
      description: 'Next',
    });
    expect(projects.updateCard).toHaveBeenNthCalledWith(2, actor, 'card-1', {
      title: 'Ship',
    });
  });

  it('does not update when two cards share a title', async () => {
    const { projects, service } = harness();
    projects.getBoard.mockResolvedValue({
      lanes: [
        {
          cards: [
            { id: 'card-1', number: 1, title: 'Deploy' },
            { id: 'card-2', number: 2, title: 'Deploy' },
          ],
        },
      ],
    });
    const result = await service.updateProjectCard({
      actor,
      cardNumber: null,
      message: `atualize ${site.name}`,
      patch: { description: 'Next' },
      projectName: site.name,
      runId: 'run-1',
      title: 'Deploy',
      trace: [],
    });

    expect(result.reply).toBe(DUPLICATE_CARD_TITLE);
    expect(projects.updateCard).not.toHaveBeenCalled();
  });

  it('does not write when the layout or the patch is incomplete', async () => {
    const { projects, service } = harness();
    projects.getBoard.mockResolvedValue({
      lanes: [
        {
          cards: [{ id: 'card-1', number: 1, title: 'Board' }],
        },
      ],
    });
    const missing = await service.createProjectCard({
      actor,
      layout: {
        assignee: '',
        description: '',
        dueAt: '',
        priority: 'Média',
        projectName: site.name,
        startsAt: '',
        title: 'Board',
      },
      message: layout(site.name, 'Board', ''),
      runId: 'run-1',
      trace: [],
    });
    const emptyUpdate = await service.updateProjectCard({
      actor,
      cardNumber: 1,
      message: `atualize ${site.name} #1`,
      patch: {},
      projectName: site.name,
      runId: 'run-1',
      trace: [],
    });

    expect(missing.reply).toContain('Descrição:');
    expect(missing.reply).toContain(`Projeto: ${site.name}`);
    expect(projects.createCard).not.toHaveBeenCalled();
    expect(projects.updateCard).not.toHaveBeenCalled();
    expect(emptyUpdate.reply).not.toContain('Operação realizada com sucesso.');
  });

  it('denies a caller without project access and hides a foreign project', async () => {
    const { projects, service } = harness();
    projects.listScopedProjectNames.mockRejectedValue(
      new ForbiddenException('Access denied.'),
    );
    const denied = await service.listProjectCards({
      actor,
      message: `liste ${site.name}`,
      projectName: site.name,
      runId: 'run-1',
      trace: [],
    });
    projects.listScopedProjectNames.mockResolvedValue([]);
    const hidden = await service.createProjectCard({
      actor,
      layout: null,
      message: `crie um card no projeto ${site.name}`,
      projectName: site.name,
      runId: 'run-1',
      trace: [],
    });

    expect(denied.reply).toBe('Você não tem permissão para esta ação.');
    expect(hidden.reply).toBe(projectNotFoundReply(site.name));
    expect(projects.createCard).not.toHaveBeenCalled();
    expect(projects.getBoard).not.toHaveBeenCalled();
  });

  it('stops when two or three projects share the name', async () => {
    const { projects, service } = harness();
    projects.listScopedProjectNames.mockResolvedValue([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Alpha' },
    ]);
    const two = await service.listProjectCards({
      actor,
      message: 'liste Alpha',
      projectName: 'Alpha',
      runId: 'run-1',
      trace: [],
    });
    projects.listScopedProjectNames.mockResolvedValue([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Alpha' },
      { id: 'c', name: 'Alpha' },
    ]);
    const three = await service.updateProjectCard({
      actor,
      message: 'atualize Alpha',
      patch: { title: 'Next' },
      projectName: 'Alpha',
      runId: 'run-1',
      title: 'Next',
      trace: [],
    });

    expect(two.reply).toBe(TWO_PROJECTS);
    expect(three.reply).toBe(ambiguousProjectReply(3));
    expect(projects.getBoard).not.toHaveBeenCalled();
    expect(projects.updateCard).not.toHaveBeenCalled();
  });

  it('shows the layout before creating and creates on the filled reply', async () => {
    const { projects, service } = harness();
    const first = await service.handleTurn({
      actor,
      message: `crie um card no projeto ${site.name}`,
      runId: 'run-1',
      trace: [],
    });
    expect(first?.reply).toBe(renderCardLayout({ projectName: site.name }));
    expect(projects.createCard).not.toHaveBeenCalled();

    projects.listCardAssigneeChoices.mockResolvedValue([
      { firstName: 'Ana', id: 'ana', lastName: 'Silva' },
    ]);
    projects.createCard.mockResolvedValue({ id: 'card-3', number: 2 });
    const second = await service.handleTurn({
      actor,
      message: layout(site.name, 'Board', 'Detalhe', 'Ana'),
      runId: 'run-2',
      trace: [],
    });

    expect(projects.createCard).toHaveBeenCalledWith(
      actor,
      site.id,
      expect.objectContaining({ assigneeUserId: 'ana', title: 'Board' }),
    );
    expect(second?.reply).toContain('#2');
  });

  it('lists the named project when the name arrives after the list request', async () => {
    const { projects, service } = harness();
    projects.listScopedProjectNames.mockResolvedValue([
      { id: 'project-test', name: 'test' },
    ]);
    projects.getBoard.mockResolvedValue({
      lanes: [
        {
          cards: [
            {
              assigneeFirstName: null,
              assigneeLastName: null,
              assigneeUserId: null,
              description: 'Detalhe',
              dueAt: null,
              id: 'card-1',
              lane: 'backlog',
              number: 1,
              priority: 'medium',
              startsAt: null,
              title: 'Primeiro',
            },
          ],
        },
      ],
    });

    const listed = await service.handleTurn({
      actor,
      message: 'test',
      previousUserMessages: ['Olá, me liste os cards', 'board test'],
      runId: 'run-3',
      trace: [],
    });

    expect(projects.getBoard).toHaveBeenCalledWith(actor, 'project-test');
    expect(listed?.reply).toContain('#1 Primeiro');
  });

  it('asks for the project name when a list does not include one', async () => {
    const { projects, service } = harness();
    const result = await service.handleTurn({
      actor,
      message: 'Olá, me liste os cards',
      runId: 'run-4',
      trace: [],
    });

    expect(result?.reply).toBe(
      'Informe o nome do projeto exatamente como cadastrado.',
    );
    expect(projects.listScopedProjectNames).not.toHaveBeenCalled();
  });

  it('replays a created trace without creating another card', async () => {
    const { projects, service } = harness();
    projects.getBoard.mockResolvedValue({
      lanes: [
        {
          cards: [
            {
              id: 'card-3',
              number: 2,
              title: 'Board',
            },
          ],
        },
      ],
    });
    const result = await service.handleTurn({
      actor,
      message: layout(site.name, 'Board', 'Detalhe'),
      runId: 'run-2',
      trace: [
        {
          callId: 'run-2:createProjectCard',
          cardId: 'card-3',
          outcome: 'created',
          projectId: site.id,
          tool: 'createProjectCard',
        },
      ],
    });

    expect(projects.createCard).not.toHaveBeenCalled();
    expect(result?.reply).toBe('Operação realizada com sucesso.\n#2');
  });

  it('matches Ana Silva even when another Ana exists, and rejects a different case', () => {
    const people = [
      { firstName: 'Ana', id: 'ana', lastName: 'Silva' },
      { firstName: 'Ana', id: 'other', lastName: 'Costa' },
    ];

    expect(resolveAssigneeId('Ana Silva', people)).toBe('ana');
    expect(resolveAssigneeId('ana', people)).toBeNull();
    expect(resolveAssigneeId('Ana', people)).toBeNull();
  });
});
