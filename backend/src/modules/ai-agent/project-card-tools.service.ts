import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../portal/auth.types.js';
import type { CardDto } from '../projects/dto/project-response.dto.js';
import { ProjectsService } from '../projects/projects.service.js';
import {
  ambiguousProjectReply,
  ASK_PROJECT_NAME,
  DUPLICATE_CARD_TITLE,
  layoutDate,
  priorityKey,
  PROJECT_CARD_DENIED,
  PROJECT_CARD_INCOMPLETE,
  PROJECT_CARD_SUCCESS,
  projectNotFoundReply,
  readCardLayout,
  renderCardLayout,
  resolveAssigneeId,
  resolveProjectByExactName,
  stripWrappingQuotes,
  type CardLayout,
  type ProjectResolution,
  type ToolTraceEntry,
} from './project-card-match.js';

export type { ToolTraceEntry };

export interface ProjectCardTurn {
  reply: string;
  trace: ToolTraceEntry[];
}

const CREATE_INTENT = /\b(criar|crie|cria|novo card)\b/i;
const LIST_INTENT = /\b(listar|liste|lista|ler|leia|mostre|mostrar)\b/i;
const UPDATE_INTENT = /\b(atualizar|atualize|alterar|altere|editar|edite)\b/i;
const CARD_RECORD_MISSING = 'Este registro não existe.';

function latestProjectCardIntent(
  messages: string[],
): 'create' | 'list' | 'update' | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const intent = projectCardIntent(messages[index]);

    if (intent) {
      return intent;
    }
  }

  return null;
}

function projectCardIntent(
  message: string,
): 'create' | 'list' | 'update' | null {
  if (CREATE_INTENT.test(message)) {
    return 'create';
  }

  if (UPDATE_INTENT.test(message)) {
    return 'update';
  }

  if (LIST_INTENT.test(message)) {
    return 'list';
  }

  return null;
}

function toolForIntent(
  intent: 'create' | 'list' | 'update',
): ToolTraceEntry['tool'] {
  if (intent === 'create') {
    return 'createProjectCard';
  }

  if (intent === 'update') {
    return 'updateProjectCard';
  }

  return 'listProjectCards';
}

@Injectable()
export class ProjectCardToolsService {
  constructor(private readonly projects: ProjectsService) {}

  async handleTurn(input: {
    actor: AuthenticatedUser;
    message: string;
    previousUserMessages?: string[];
    runId: string;
    trace: ToolTraceEntry[];
  }): Promise<ProjectCardTurn | null> {
    const replay = input.trace.find((entry) => entry.outcome === 'created');

    if (replay?.projectId && replay.cardId) {
      const number = await this.cardNumber(
        input.actor,
        replay.projectId,
        replay.cardId,
      );

      if (number !== null) {
        return {
          reply: successReply(number),
          trace: input.trace,
        };
      }
    }

    if (input.trace.length >= 4) {
      return null;
    }

    const layout = readCardLayout(input.message);

    if (layout) {
      return this.createProjectCard({
        actor: input.actor,
        layout,
        message: input.message,
        runId: input.runId,
        trace: input.trace,
      });
    }

    const directIntent = projectCardIntent(input.message);
    const carriedIntent = latestProjectCardIntent(
      input.previousUserMessages ?? [],
    );
    const intent = directIntent ?? carriedIntent;

    if (!intent) {
      return this.listWhenMessageIsExactProjectName(input);
    }

    const projectName = directIntent
      ? informedProjectName(input.message)
      : stripWrappingQuotes(input.message);

    if (projectName.length === 0) {
      return {
        reply: ASK_PROJECT_NAME,
        trace: [
          ...input.trace,
          entry(input.runId, toolForIntent(intent), 'invalid', null, null),
        ],
      };
    }

    if (intent === 'create') {
      return this.createProjectCard({
        actor: input.actor,
        layout: null,
        message: input.message,
        projectName,
        runId: input.runId,
        trace: input.trace,
      });
    }

    if (intent === 'update') {
      return this.updateProjectCard({
        actor: input.actor,
        cardNumber: cardNumberFromMessage(input.message),
        message: input.message,
        patch: {},
        projectName,
        runId: input.runId,
        title: quotedTitle(input.message),
        trace: input.trace,
      });
    }

    return this.listProjectCards({
      actor: input.actor,
      message: input.message,
      projectName,
      runId: input.runId,
      trace: input.trace,
    });
  }

  private async listWhenMessageIsExactProjectName(input: {
    actor: AuthenticatedUser;
    message: string;
    runId: string;
    trace: ToolTraceEntry[];
  }): Promise<ProjectCardTurn | null> {
    const projectName = stripWrappingQuotes(input.message);

    if (projectName.length === 0) {
      return null;
    }

    try {
      const projects = await this.projects.listScopedProjectNames(input.actor);
      const exact = projects.filter((project) => project.name === projectName);

      if (exact.length !== 1) {
        return null;
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return {
          reply: PROJECT_CARD_DENIED,
          trace: [
            ...input.trace,
            entry(input.runId, 'listProjectCards', 'forbidden', null, null),
          ],
        };
      }

      throw error;
    }

    return this.listProjectCards({
      actor: input.actor,
      message: input.message,
      projectName,
      runId: input.runId,
      trace: input.trace,
    });
  }

  async listProjectCards(input: {
    actor: AuthenticatedUser;
    message: string;
    projectName: string;
    runId: string;
    trace: ToolTraceEntry[];
  }): Promise<ProjectCardTurn> {
    const resolved = await this.resolve(input);

    if (resolved.kind !== 'resolved') {
      return this.unresolved('listProjectCards', input, resolved);
    }

    const board = await this.projects.getBoard(
      input.actor,
      resolved.project.id,
    );
    const cards = board.lanes.flatMap((lane) => lane.cards);

    return {
      reply: renderList(cards),
      trace: [
        ...input.trace,
        entry(
          input.runId,
          'listProjectCards',
          'listed',
          resolved.project.id,
          null,
        ),
      ],
    };
  }

  async createProjectCard(input: {
    actor: AuthenticatedUser;
    layout: CardLayout | null;
    message: string;
    projectName?: string;
    runId: string;
    trace: ToolTraceEntry[];
  }): Promise<ProjectCardTurn> {
    const projectName = input.layout?.projectName ?? input.projectName ?? '';
    const resolved = await this.resolve({
      ...input,
      projectName,
    });

    if (resolved.kind !== 'resolved') {
      return this.unresolved('createProjectCard', input, resolved);
    }

    if (!input.layout || !input.layout.title || !input.layout.description) {
      return {
        reply: renderCardLayout({
          assignee: input.layout?.assignee,
          description: input.layout?.description,
          dueAt: input.layout?.dueAt,
          priority: input.layout?.priority,
          projectName: resolved.project.name,
          startsAt: input.layout?.startsAt,
          title: input.layout?.title,
        }),
        trace: [
          ...input.trace,
          entry(
            input.runId,
            'createProjectCard',
            'invalid',
            resolved.project.id,
            null,
          ),
        ],
      };
    }

    const priority = priorityKey(input.layout.priority);
    const startsAt = layoutDate(input.layout.startsAt);
    const dueAt = layoutDate(input.layout.dueAt);

    if (priority === null || startsAt === undefined || dueAt === undefined) {
      return {
        reply: renderCardLayout({
          ...input.layout,
          projectName: resolved.project.name,
        }),
        trace: [
          ...input.trace,
          entry(
            input.runId,
            'createProjectCard',
            'invalid',
            resolved.project.id,
            null,
          ),
        ],
      };
    }

    const people = await this.projects.listCardAssigneeChoices(
      input.actor,
      resolved.project.id,
    );
    const assigneeUserId = assigneeFromLayout(input.layout.assignee, people);
    const created = await this.projects.createCard(
      input.actor,
      resolved.project.id,
      {
        assigneeUserId,
        description: input.layout.description,
        dueAt,
        priority,
        startsAt,
        title: input.layout.title,
      },
    );

    return {
      reply: successReply(created.number),
      trace: [
        ...input.trace,
        entry(
          input.runId,
          'createProjectCard',
          'created',
          resolved.project.id,
          created.id,
        ),
      ],
    };
  }

  async updateProjectCard(input: {
    actor: AuthenticatedUser;
    assigneeName?: string;
    cardNumber?: number | null;
    message: string;
    patch: {
      description?: string;
      dueAt?: string | null;
      priority?: 'low' | 'medium' | 'high';
      startsAt?: string | null;
      title?: string;
    };
    projectName: string;
    runId: string;
    title?: string;
    trace: ToolTraceEntry[];
  }): Promise<ProjectCardTurn> {
    const resolved = await this.resolve(input);

    if (resolved.kind !== 'resolved') {
      return this.unresolved('updateProjectCard', input, resolved);
    }

    const board = await this.projects.getBoard(
      input.actor,
      resolved.project.id,
    );
    const cards = board.lanes.flatMap((lane) => lane.cards);
    const title = input.title?.trim() ?? '';
    const numbered =
      input.cardNumber === undefined || input.cardNumber === null
        ? []
        : cards.filter((card) => card.number === input.cardNumber);

    if (
      input.cardNumber !== undefined &&
      input.cardNumber !== null &&
      numbered.length !== 1
    ) {
      return this.missingCard(input, resolved.project.id);
    }

    if (numbered.length === 1 && title && numbered[0].title !== title) {
      return this.missingCard(input, resolved.project.id);
    }

    const titled = title ? cards.filter((card) => card.title === title) : [];

    if (!numbered.length && titled.length > 1) {
      return {
        reply: DUPLICATE_CARD_TITLE,
        trace: [
          ...input.trace,
          entry(
            input.runId,
            'updateProjectCard',
            'ambiguous',
            resolved.project.id,
            null,
          ),
        ],
      };
    }

    if (!numbered.length && titled.length === 0) {
      return this.missingCard(input, resolved.project.id);
    }

    const card = numbered[0] ?? titled[0];
    const patch: {
      assigneeUserId?: string;
      description?: string;
      dueAt?: string | null;
      priority?: 'low' | 'medium' | 'high';
      startsAt?: string | null;
      title?: string;
    } = { ...input.patch };
    const assigneeName = input.assigneeName?.trim() ?? '';

    if (assigneeName) {
      const people = await this.projects.listCardAssigneeChoices(
        input.actor,
        resolved.project.id,
      );
      const assigneeUserId = resolveAssigneeId(assigneeName, people);

      if (assigneeUserId) {
        patch.assigneeUserId = assigneeUserId;
      }
    }

    if (!hasPatch(patch)) {
      return {
        reply: PROJECT_CARD_INCOMPLETE,
        trace: [
          ...input.trace,
          entry(
            input.runId,
            'updateProjectCard',
            'invalid',
            resolved.project.id,
            null,
          ),
        ],
      };
    }

    const updated = await this.projects.updateCard(input.actor, card.id, patch);

    return {
      reply: successReply(updated.number),
      trace: [
        ...input.trace,
        entry(
          input.runId,
          'updateProjectCard',
          'updated',
          resolved.project.id,
          updated.id,
        ),
      ],
    };
  }

  private async resolve(input: {
    actor: AuthenticatedUser;
    message: string;
    projectName: string;
    runId: string;
    trace: ToolTraceEntry[];
  }): Promise<ProjectResolution | { kind: 'forbidden' }> {
    try {
      const projects = await this.projects.listScopedProjectNames(input.actor);
      return resolveProjectByExactName(
        input.message,
        input.projectName,
        projects,
      );
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return { kind: 'forbidden' };
      }

      throw error;
    }
  }

  private unresolved(
    tool: ToolTraceEntry['tool'],
    input: { runId: string; trace: ToolTraceEntry[] },
    resolved: ProjectResolution | { kind: 'forbidden' },
  ): ProjectCardTurn {
    if (resolved.kind === 'forbidden') {
      return {
        reply: PROJECT_CARD_DENIED,
        trace: [
          ...input.trace,
          entry(input.runId, tool, 'forbidden', null, null),
        ],
      };
    }

    if (resolved.kind === 'ambiguous') {
      return {
        reply: ambiguousProjectReply(resolved.count),
        trace: [
          ...input.trace,
          entry(input.runId, tool, 'ambiguous', null, null),
        ],
      };
    }

    if (resolved.kind !== 'not_found') {
      return {
        reply: projectNotFoundReply(''),
        trace: [
          ...input.trace,
          entry(input.runId, tool, 'not_found', null, null),
        ],
      };
    }

    return {
      reply: projectNotFoundReply(resolved.name),
      trace: [
        ...input.trace,
        entry(input.runId, tool, 'not_found', null, null),
      ],
    };
  }

  private missingCard(
    input: { runId: string; trace: ToolTraceEntry[] },
    projectId: string,
  ): ProjectCardTurn {
    return {
      reply: CARD_RECORD_MISSING,
      trace: [
        ...input.trace,
        entry(input.runId, 'updateProjectCard', 'not_found', projectId, null),
      ],
    };
  }

  private async cardNumber(
    actor: AuthenticatedUser,
    projectId: string,
    cardId: string,
  ): Promise<number | null> {
    const board = await this.projects.getBoard(actor, projectId);
    const card = board.lanes
      .flatMap((lane) => lane.cards)
      .find((item) => item.id === cardId);

    return card?.number ?? null;
  }
}

function entry(
  runId: string,
  tool: ToolTraceEntry['tool'],
  outcome: ToolTraceEntry['outcome'],
  projectId: string | null,
  cardId: string | null,
): ToolTraceEntry {
  return {
    callId: `${runId}:${tool}`,
    cardId,
    outcome,
    projectId,
    tool,
  };
}

function successReply(number: number): string {
  return `${PROJECT_CARD_SUCCESS}\n#${number}`;
}

function renderList(cards: CardDto[]): string {
  if (cards.length === 0) {
    return 'Nenhum card.';
  }

  return cards
    .map((card) => {
      const assignee = card.assigneeUserId
        ? `${card.assigneeFirstName} ${card.assigneeLastName}`.trim()
        : '';

      return [
        `#${card.number} ${card.title}`,
        `Descrição: ${card.description}`,
        `Raia: ${card.lane}`,
        `Prioridade: ${card.priority}`,
        `Associado: ${assignee}`,
        `Data início: ${card.startsAt ?? ''}`,
        `Data fim: ${card.dueAt ?? ''}`,
      ].join('\n');
    })
    .join('\n\n');
}

function assigneeFromLayout(
  value: string,
  people: Array<{ firstName: string; id: string; lastName: string }>,
): string | null {
  if (!value.trim()) {
    return null;
  }

  return resolveAssigneeId(value, people);
}

function informedProjectName(message: string): string {
  const quoted = /"([^"]*)"|'([^']*)'/.exec(message);

  if (quoted) {
    return quoted[1] ?? quoted[2] ?? '';
  }

  const labeled = /projeto\s+(\S(?:.*\S)?)/i.exec(message);
  return labeled?.[1] ?? '';
}

function quotedTitle(message: string): string {
  const matches = [...message.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  return matches.length > 1 ? matches[1] : '';
}

function cardNumberFromMessage(message: string): number | null {
  const match = /#(\d+)/.exec(message);
  return match ? Number(match[1]) : null;
}

function hasPatch(patch: {
  assigneeUserId?: string;
  description?: string;
  dueAt?: string | null;
  priority?: string;
  startsAt?: string | null;
  title?: string;
}): boolean {
  return (
    patch.assigneeUserId !== undefined ||
    patch.description !== undefined ||
    patch.dueAt !== undefined ||
    patch.priority !== undefined ||
    patch.startsAt !== undefined ||
    patch.title !== undefined
  );
}
