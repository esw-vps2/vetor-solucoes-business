import { ApiError, type KanbanFilters, type UserListItem } from '@/lib/api/client';
import { hasProjectsAccess } from '@/lib/portal-actions';

export const KANBAN_LANES = [
  {
    accentClass: 'border-board-lane-backlog',
    accentColor: '#64748B',
    key: 'backlog',
    label: 'Backlog',
  },
  { accentClass: 'border-board-lane-ready', accentColor: '#3D9CF0', key: 'ready', label: 'Pronto' },
  {
    accentClass: 'border-board-lane-working',
    accentColor: '#F5A524',
    key: 'working',
    label: 'Trabalhando',
  },
  {
    accentClass: 'border-board-lane-review',
    accentColor: '#7B6CFF',
    key: 'review',
    label: 'Revisão',
  },
  {
    accentClass: 'border-board-lane-deploy',
    accentColor: '#2EC4B6',
    key: 'deploy',
    label: 'Deploy',
  },
  {
    accentClass: 'border-board-lane-done',
    accentColor: '#BDDA2B',
    key: 'done',
    label: 'Finalizado',
  },
] as const;

export type KanbanLaneKey = (typeof KANBAN_LANES)[number]['key'];

export function lanePresentation(lane: { color?: string; key: string; label?: string }): {
  color: string;
  label: string;
} {
  const known = KANBAN_LANES.find((item) => item.key === lane.key);

  return {
    color: lane.color || known?.accentColor || '#64748B',
    label: lane.label || known?.label || lane.key,
  };
}

export const CARD_PRIORITIES = [
  { chipClass: 'bg-board-priority-low text-navy', key: 'low', label: 'Baixa' },
  { chipClass: 'bg-board-priority-medium text-navy', key: 'medium', label: 'Média' },
  { chipClass: 'bg-board-priority-high text-white', key: 'high', label: 'Alta' },
] as const;

export type CardPriorityKey = (typeof CARD_PRIORITIES)[number]['key'];

export const TAG_COLORS = [
  { chipClass: 'bg-board-label-lime text-navy', key: 'lime', label: 'Lima' },
  { chipClass: 'bg-board-label-sky text-navy', key: 'sky', label: 'Azul' },
  { chipClass: 'bg-board-label-pink text-white', key: 'pink', label: 'Rosa' },
  { chipClass: 'bg-board-label-amber text-navy', key: 'amber', label: 'Âmbar' },
  { chipClass: 'bg-board-label-violet text-white', key: 'violet', label: 'Violeta' },
  { chipClass: 'bg-board-label-teal text-navy', key: 'teal', label: 'Verde-água' },
  { chipClass: 'bg-board-label-coral text-white', key: 'coral', label: 'Coral' },
  { chipClass: 'bg-board-label-navy text-white', key: 'navy', label: 'Marinho' },
] as const;

export type TagColorKey = (typeof TAG_COLORS)[number]['key'];

export const DUE_URGENCY_CLASS = {
  future: 'bg-board-due-future text-white',
  overdue: 'bg-board-due-overdue text-white',
  today: 'bg-board-due-today text-navy',
} as const;

export type DueUrgency = keyof typeof DUE_URGENCY_CLASS;

export const PROJECT_COPY = {
  associated: 'Associado',
  attach: 'Anexar',
  attachments: 'Anexos',
  cardTitle: 'Título',
  cancel: 'Cancelar',
  checklist: 'Checklist',
  comment: 'Comentar',
  comments: 'Comentários',
  confirmDeleteCard: 'Excluir este card?',
  confirmDeleteFile: 'Excluir este arquivo?',
  confirmDeleteFolder: 'Excluir esta pasta e todo o conteúdo?',
  confirmDeleteProject: 'Excluir este projeto e todos os cards?',
  confirmDeleteWorkspace: 'Excluir esta workspace e todos os projetos e cards?',
  cover: 'Capa',
  created: 'Criado',
  dateRangeInvalid: 'A data início deve ser anterior ou igual à data fim.',
  dateTime: 'Data e hora',
  description: 'Descrição',
  endDate: 'Data fim',
  startDate: 'Data início',
  delete: 'Excluir',
  download: 'Baixar',
  downloadFolder: 'Baixar pasta',
  edit: 'Editar',
  emptyChecklist: 'Nenhum item.',
  emptyComments: 'Nenhum comentário.',
  emptyDocuments: 'Nenhum arquivo neste projeto.',
  emptyLane: 'Nenhum card.',
  newLane: 'Nova raia',
  renameLane: 'Renomear',
  deleteLane: 'Excluir raia',
  confirmDeleteLane: 'Excluir esta raia?',
  laneName: 'Nome da raia',
  emptyProjects: 'Nenhum projeto nesta workspace.',
  emptyWorkspaces: 'Nenhuma workspace neste tenant.',
  forbidden: 'Você não tem permissão para esta ação.',
  genericFailure: 'Não foi possível concluir a operação.',
  invalidBackground: 'Envie JPEG, PNG ou WEBP de até 8 MB.',
  invalidFile: 'Envie um arquivo permitido de até 5 MB.',
  invalidFolderTotal: 'A pasta deve ter no máximo 500 MB.',
  move: 'Mover',
  preview: 'Visualizar',
  previewUnavailable:
    'Este arquivo não está habilitado para visualização. Os únicos arquivos habilitados são PDF e fotos.',
  newCard: 'Novo card',
  newChecklistItem: 'Novo item',
  newFolder: 'Nova pasta',
  newProject: 'Novo projeto',
  newWorkspace: 'Nova workspace',
  notFound: 'Este registro não existe.',
  priority: 'Prioridade',
  projectFiles: 'Arquivos do projeto',
  removeBackground: 'Remover fundo',
  removeCover: 'Remover capa',
  rename: 'Renomear',
  request: 'Solicitação',
  save: 'Salvar',
  setBoardBackground: 'Fundo do board',
  setCover: 'Definir capa',
  success: 'Operação realizada com sucesso.',
  tags: 'Tags',
  tenant: 'Tenant',
  tenantPlaceholder: 'Selecione um tenant',
  title: 'Projetos',
  attachmentFileLimit: 'Cada arquivo até 5 MB.',
  uploadFile: 'Enviar arquivo',
  uploadDashboardFile: 'Enviar arquivo do painel',
  shareDashboard: 'Share',
  dashboardLink: 'Link do painel',
  linkCopied: 'Link copiado.',
  filters: 'Filtros',
  filterStatus: 'Status',
  filterDate: 'Filtro de data',
  filterDateAny: 'Qualquer data',
  filterDateStart: 'A partir de',
  filterDateEnd: 'Até',
  filterDateRange: 'Intervalo',
  filterStartDate: 'Data inicial',
  filterEndDate: 'Data final',
  filterTasks: 'Conclusão',
  filterTasksAll: 'Todas',
  filterTasksComplete: 'Concluídas',
  filterTasksIncomplete: 'Pendentes',
  boardActions: 'Ações do board',
  boardColumns: 'Colunas',
  uploadFolder: 'Enviar pasta',
  uploadedBy: 'Enviado por',
  down: 'Descer',
  up: 'Subir',
} as const;

export const ALLOWED_PROJECT_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export const IMAGE_PROJECT_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export const ALLOWED_BACKGROUND_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const MAX_PROJECT_FILE_BYTES = 5 * 1024 * 1024;

export const MAX_ATTACHMENTS_PER_CARD = 10;

export const MAX_PROJECT_TREE_BYTES = 500 * 1024 * 1024;

export const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;

export const PROJECT_FILE_ACCEPT =
  '.jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.md,.json,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,text/markdown,application/json,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

export const BACKGROUND_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export const BOARD_EASE = [0.16, 1, 0.3, 1] as const;

export const DEFAULT_BOARD_BACKGROUND_CLASS = 'board-canvas-default';

export function laneLabel(key: string): string {
  return KANBAN_LANES.find((lane) => lane.key === key)?.label ?? key;
}

export function laneAccentClass(key: string): string {
  return KANBAN_LANES.find((lane) => lane.key === key)?.accentClass ?? 'border-board-lane-backlog';
}

export function otherLanes(current: string): (typeof KANBAN_LANES)[number][] {
  return KANBAN_LANES.filter((lane) => lane.key !== current);
}

export function tagChipClass(color: string): string {
  return (
    TAG_COLORS.find((item) => item.key === color)?.chipClass ?? 'bg-board-label-lime text-navy'
  );
}

export function dueAtFromDateInput(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00-03:00`).toISOString();
}

export const EMPTY_KANBAN_FILTERS: KanbanFilters = {
  date: null,
  status: [],
  taskCompletion: 'all',
};

export function addCardLaneLabel(label: string): string {
  return `Adicionar card em ${label}`;
}

export function cardIsComplete(card: {
  checklistItems: ReadonlyArray<{ done: boolean }>;
}): boolean {
  return card.checklistItems.length > 0 && card.checklistItems.every((item) => item.done);
}

export function kanbanFiltersArePersistable(filters: KanbanFilters): boolean {
  if (!filters.date) {
    return true;
  }

  if (filters.date.mode === 'start') {
    return Boolean(filters.date.startDate);
  }

  if (filters.date.mode === 'end') {
    return Boolean(filters.date.endDate);
  }

  return Boolean(
    filters.date.startDate &&
    filters.date.endDate &&
    filters.date.startDate <= filters.date.endDate,
  );
}

export function cardMatchesKanbanFilters(
  card: {
    checklistItems: ReadonlyArray<{ done: boolean }>;
    dueAt: string | null;
    lane: string;
  },
  filters: KanbanFilters,
): boolean {
  if (filters.status.length > 0 && !filters.status.includes(card.lane)) {
    return false;
  }

  if (filters.taskCompletion !== 'all') {
    const complete = cardIsComplete(card);
    if (filters.taskCompletion === 'complete' && !complete) {
      return false;
    }

    if (filters.taskCompletion === 'incomplete' && complete) {
      return false;
    }
  }

  if (!filters.date) {
    return true;
  }

  const dueDate = dateInputFromDueAt(card.dueAt);
  if (!dueDate) {
    return false;
  }

  if (filters.date.mode === 'start') {
    return !filters.date.startDate || dueDate >= filters.date.startDate;
  }

  if (filters.date.mode === 'end') {
    return !filters.date.endDate || dueDate <= filters.date.endDate;
  }

  if (filters.date.startDate && dueDate < filters.date.startDate) {
    return false;
  }

  if (filters.date.endDate && dueDate > filters.date.endDate) {
    return false;
  }

  return true;
}

export function dateInputFromDueAt(iso: string | null): string {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function formatDueAt(iso: string | null): string {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function dueUrgency(iso: string, now = new Date()): DueUrgency {
  const dueDay = dateInputFromDueAt(iso);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  if (dueDay < today) {
    return 'overdue';
  }

  if (dueDay === today) {
    return 'today';
  }

  return 'future';
}

export function assigneeInitials(firstName: string, lastName: string): string {
  return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
}

export function filterCardAssigneeCandidates(
  users: UserListItem[],
  projectTenantId: string,
  includeUserId?: string,
): UserListItem[] {
  const eligible = users.filter(
    (item) =>
      item.status === 'active' &&
      item.tenantId === projectTenantId &&
      hasProjectsAccess(item),
  );

  if (!includeUserId || eligible.some((item) => item.id === includeUserId)) {
    return eligible;
  }

  const retained = users.find((item) => item.id === includeUserId);

  return retained ? [...eligible, retained] : eligible;
}

export function isAllowedProjectFile(file: File): boolean {
  return ALLOWED_PROJECT_FILE_TYPES.has(file.type) && file.size <= MAX_PROJECT_FILE_BYTES;
}

export function canPreviewProjectFile(contentType: string | null): boolean {
  return contentType === 'application/pdf' || IMAGE_PROJECT_FILE_TYPES.has(contentType ?? '');
}

export function cardAttachmentsToUpload(
  files: ArrayLike<File>,
  existingCount: number,
): File[] | null {
  const selected = Array.from(files);

  if (selected.length === 0) {
    return [];
  }

  const remaining = MAX_ATTACHMENTS_PER_CARD - existingCount;

  if (remaining <= 0 || selected.length > remaining) {
    return null;
  }

  if (selected.some((file) => !isAllowedProjectFile(file))) {
    return null;
  }

  return selected;
}

export function isAllowedBackgroundFile(file: File): boolean {
  return ALLOWED_BACKGROUND_TYPES.has(file.type) && file.size <= MAX_BACKGROUND_BYTES;
}

export function folderUploadBytes(files: File[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

export function fileRelativePath(file: File): string {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return relative && relative.length > 0 ? relative : file.name;
}

export type ProjectErrorKind = 'file' | 'folder' | 'background' | false;

export function projectErrorMessage(error: unknown, problem: ProjectErrorKind = false): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return PROJECT_COPY.forbidden;
    }

    if (error.status === 404) {
      return PROJECT_COPY.notFound;
    }

    if (error.status === 400 && problem === 'file') {
      return PROJECT_COPY.invalidFile;
    }

    if (error.status === 400 && problem === 'folder') {
      return PROJECT_COPY.invalidFolderTotal;
    }

    if (error.status === 400 && problem === 'background') {
      return PROJECT_COPY.invalidBackground;
    }
  }

  return PROJECT_COPY.genericFailure;
}
