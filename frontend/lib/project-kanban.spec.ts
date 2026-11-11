import { describe, expect, it } from 'vitest';
import {
  assigneeInitials,
  filterCardAssigneeCandidates,
  cardAttachmentsToUpload,
  cardMatchesKanbanFilters,
  dueUrgency,
  formatDateTime,
  canPreviewProjectFile,
  isAllowedBackgroundFile,
  isAllowedProjectFile,
  MAX_ATTACHMENTS_PER_CARD,
  MAX_PROJECT_FILE_BYTES,
  PROJECT_COPY,
} from './project-kanban';

describe('project-kanban helpers', () => {
  it('classifies due dates in America/Sao_Paulo', () => {
    expect(dueUrgency('2026-09-20T03:00:00.000Z', new Date('2026-09-21T15:00:00.000Z'))).toBe(
      'overdue',
    );
    expect(dueUrgency('2026-09-21T03:00:00.000Z', new Date('2026-09-21T15:00:00.000Z'))).toBe(
      'today',
    );
    expect(dueUrgency('2026-09-22T03:00:00.000Z', new Date('2026-09-21T15:00:00.000Z'))).toBe(
      'future',
    );
  });

  it('accepts allowlisted files and rejects svg, html, and oversized files', () => {
    expect(isAllowedProjectFile(new File(['ok'], 'notes.txt', { type: 'text/plain' }))).toBe(true);
    expect(
      isAllowedProjectFile(new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' })),
    ).toBe(false);
    expect(
      isAllowedProjectFile(new File(['<html></html>'], 'page.html', { type: 'text/html' })),
    ).toBe(false);
    expect(isAllowedBackgroundFile(new File(['x'], 'bg.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(isAllowedBackgroundFile(new File(['x'], 'bg.gif', { type: 'image/gif' }))).toBe(false);
    expect(canPreviewProjectFile('application/pdf')).toBe(true);
    expect(canPreviewProjectFile('image/png')).toBe(true);
    expect(canPreviewProjectFile('text/plain')).toBe(false);
  });

  it('accepts several card files when each is allowed, under 5 MB, and within the card cap', () => {
    const notes = new File(['ok'], 'notes.txt', { type: 'text/plain' });
    const pdf = new File(['ok'], 'spec.pdf', { type: 'application/pdf' });
    expect(cardAttachmentsToUpload([notes, pdf], 0)).toEqual([notes, pdf]);
    expect(cardAttachmentsToUpload([notes], MAX_ATTACHMENTS_PER_CARD)).toBeNull();
    expect(
      cardAttachmentsToUpload(
        Array.from({ length: 10 }, () => notes),
        1,
      ),
    ).toBeNull();
    expect(
      cardAttachmentsToUpload(
        [new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' })],
        0,
      ),
    ).toBeNull();

    const oversized = new File(['ok'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(oversized, 'size', { value: MAX_PROJECT_FILE_BYTES + 1 });
    expect(cardAttachmentsToUpload([oversized], 0)).toBeNull();
  });

  it('keeps recorded Portuguese copy', () => {
    expect(PROJECT_COPY.invalidFile).toBe('Envie um arquivo permitido de até 5 MB.');
    expect(PROJECT_COPY.attachmentFileLimit).toBe('Cada arquivo até 5 MB.');
    expect(PROJECT_COPY.edit).toBe('Editar');
    expect(PROJECT_COPY.attachments).toBe('Anexos');
    expect(PROJECT_COPY.comments).toBe('Comentários');
    expect(PROJECT_COPY.comment).toBe('Comentar');
    expect(PROJECT_COPY.created).toBe('Criado');
    expect(PROJECT_COPY.associated).toBe('Associado');
    expect(PROJECT_COPY.dateTime).toBe('Data e hora');
    expect(PROJECT_COPY.priority).toBe('Prioridade');
    expect(PROJECT_COPY.tags).toBe('Tags');
    expect(PROJECT_COPY.save).toBe('Salvar');
    expect(assigneeInitials('Ana', 'Silva')).toBe('AS');
  });

  it('filters card assignees by tenant, active status, and Projetos access', () => {
    const tenantId = 'tenant-id';
    const eligible = {
      email: 'ana@example.com',
      enabledActions: ['viewProjects'],
      firstName: 'Ana',
      id: 'user-id',
      lastName: 'Silva',
      profile: 'Usuario',
      status: 'active',
      tenantId,
      tenantName: 'Acme',
      tenantSlug: 'acme',
    };

    expect(
      filterCardAssigneeCandidates(
        [
          eligible,
          { ...eligible, id: 'other-tenant', tenantId: 'other-tenant' },
          { ...eligible, id: 'blocked', status: 'blocked' },
          {
            ...eligible,
            enabledActions: ['painel'],
            id: 'no-projects',
            profile: 'Usuario',
          },
        ],
        tenantId,
      ).map((user) => user.id),
    ).toEqual(['user-id']);
    expect(filterCardAssigneeCandidates([eligible], tenantId, 'missing-id')).toEqual([eligible]);
  });

  it('matches status, due date, and checklist completion', () => {
    const openCard = {
      checklistItems: [{ done: false }],
      dueAt: '2026-09-21T03:00:00.000Z',
      lane: 'backlog',
    };
    const doneCard = {
      checklistItems: [{ done: true }],
      dueAt: '2026-09-25T03:00:00.000Z',
      lane: 'ready',
    };

    expect(
      cardMatchesKanbanFilters(openCard, {
        date: { endDate: null, mode: 'start', startDate: '2026-09-21' },
        status: ['backlog'],
        taskCompletion: 'incomplete',
      }),
    ).toBe(true);
    expect(
      cardMatchesKanbanFilters(doneCard, {
        date: { endDate: '2026-09-22', mode: 'end', startDate: null },
        status: [],
        taskCompletion: 'all',
      }),
    ).toBe(false);
    expect(
      cardMatchesKanbanFilters(doneCard, {
        date: { endDate: '2026-09-30', mode: 'range', startDate: '2026-09-22' },
        status: ['ready'],
        taskCompletion: 'complete',
      }),
    ).toBe(true);
    expect(
      cardMatchesKanbanFilters(
        { checklistItems: [], dueAt: null, lane: 'done' },
        { date: null, status: [], taskCompletion: 'complete' },
      ),
    ).toBe(false);
  });

  it('formats timestamps in America/Sao_Paulo', () => {
    expect(formatDateTime('2026-09-21T12:00:00.000Z')).toBe('21/09/2026, 09:00');
    expect(formatDateTime('not-a-date')).toBe('');
  });
});
